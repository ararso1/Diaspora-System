"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText, User, Mail, Phone, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedModal } from "@/components/ui/animated-modal";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

/** Optional shared inputs */
import CountrySelect from "@/components/wizard/inputs/CountrySelect";
import PhoneInput from "@/components/wizard/inputs/PhoneInput";

/* -------------------- Types (aligned to your backend) -------------------- */
type Gender = "MALE" | "FEMALE" | "OTHER";
type PurposeType = "INVESTMENT" | "TOURISM" | "FAMILY" | "STUDY" | "CHARITY_NGO" | "OTHER";

type ApiUser = {
  id: number | string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
};

type ApiDiaspora = {
  id: string; // uuid
  diaspora_id: string;
  user?: ApiUser | number | string;   // depending on serializer
  user_id?: number | string;

  gender?: Gender | null;
  dob?: string | null;

  primary_phone?: string | null;
  whatsapp?: string | null;

  country_of_residence?: string | null;
  city_of_residence?: string | null;

  arrival_date?: string | null;
  expected_stay_duration?: string | null;
  is_returnee?: boolean;

  preferred_language?: string | null;
  communication_opt_in?: boolean | null;

  address_local?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;

  passport_no?: string | null;
  id_number?: string | null;

  created_at?: string;
  updated_at?: string;
};

type ApiPurpose = {
  id: number | string;
  diaspora: string; // FK to Diaspora.id (UUID)
  type: PurposeType;
  description?: string;
  sector?: string | null;
  sub_sector?: string | null;
  investment_type?: string | null;
  estimated_capital?: number | string | null;
  currency?: string | null;
  jobs_expected?: number | null;
  land_requirement?: boolean | null;
  land_size?: number | null;
  preferred_location_note?: string | null;
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ON_HOLD";
  created_at?: string;
};

/* -------------------- Helpers & Constants -------------------- */

const SUPPORTS_NESTED_USER_UPDATE = false; // set true if /diasporas/:id/ accepts nested { user: {...} }

const SECTORS: Record<string, string[]> = {
  "Agriculture & Agro-Processing": [
    "Agro-processing & value addition",
    "Agri-tech & irrigation solutions",
  ],
  "Manufacturing & Industry": [
    "Textiles & garment production",
    "Construction materials",
  ],
};
const INVESTMENT_TYPES = ["new company", "JV", "expansion"];
const CURRENCIES = ["USD", "ETB", "EUR"];

const purposeStatusPill: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  ON_HOLD: "bg-purple-100 text-purple-800",
};

const purposeTypeLabel: Record<PurposeType, string> = {
  INVESTMENT: "Investment",
  TOURISM: "Tourism",
  FAMILY: "Family",
  STUDY: "Study",
  CHARITY_NGO: "Charity/NGO",
  OTHER: "Other",
};

const pretty = (v?: string | null) => (v && String(v).trim().length ? v : "—");

/** Fetch paginated or flat */
async function fetchAllPaginated<T>(url: string, headers: Record<string, string>) {
  let next: string | null = url;
  const all: T[] = [];
  while (next) {
    const res = await fetch(next, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} on ${next}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      all.push(...data); next = null;
    } else if (Array.isArray((data as any)?.results)) {
      all.push(...(data as any).results);
      next = (data as any).next || null;
    } else {
      all.push(data); next = null;
    }
  }
  return all;
}

const withPrefix = (prefix: string, local?: string | null) => {
  const clean = String(local || "").trim().replace(/^\+?251/, "").replace(/\s+/g, "");
  return clean ? `${prefix}${clean}` : "";
};

/* -------------------- Purpose modal state -------------------- */
type PurposeDraft = {
  id?: number | string | null;
  type?: PurposeType;
  description?: string;
  sector?: string;
  sub_sector?: string;
  investment_type?: string;
  estimated_capital?: number | null;
  currency?: string;
  jobs_expected?: number | null;
  land_requirement?: boolean;
  land_size?: number | null;
  preferred_location_note?: string;
  status?: ApiPurpose["status"];
};

const emptyPurpose: PurposeDraft = {
  id: null,
  type: undefined,
  description: "",
  sector: "",
  sub_sector: "",
  investment_type: "",
  estimated_capital: null,
  currency: "",
  jobs_expected: null,
  land_requirement: false,
  land_size: null,
  preferred_location_note: "",
  status: "DRAFT",
};

/* ============================ Page ============================ */
export default function DiasporaEditPage() {
  const { id } = useParams(); // diaspora uuid
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  // Role gating
  const groupsRaw = typeof window !== "undefined" ? localStorage.getItem("user_groups") : "[]";
  const groups: string[] = useMemo(() => {
    try {
      const parsed = JSON.parse(groupsRaw || "[]");
      return (Array.isArray(parsed) ? parsed : [])
        .map((g) => (typeof g === "string" ? g : g?.name))
        .filter(Boolean);
    } catch { return []; }
  }, [groupsRaw]);
  const isOfficer = groups.includes("Officer");

  // Loading & errors
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Primary data
  const [diaspora, setDiaspora] = useState<ApiDiaspora | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [purposes, setPurposes] = useState<ApiPurpose[]>([]);

  // Edits (local form)
  // USER
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");

  // DIASPORA
  const [gender, setGender] = useState<Gender | "">("");
  const [dob, setDob] = useState<string>("");

  const [primaryPhone, setPrimaryPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [countryRes, setCountryRes] = useState("Ethiopia");
  const [cityRes, setCityRes] = useState("");

  const [arrival, setArrival] = useState("");
  const [stay, setStay] = useState("");
  const [returnee, setReturnee] = useState(false);

  const [lang, setLang] = useState("English");
  const [langOther, setLangOther] = useState("");
  const [comms, setComms] = useState(true);

  const [localAddr, setLocalAddr] = useState("");
  const [emName, setEmName] = useState("");
  const [emPhone, setEmPhone] = useState("");

  const [passport, setPassport] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Purpose modal
  const [purposeModalOpen, setPurposeModalOpen] = useState(false);
  const [purposeDraft, setPurposeDraft] = useState<PurposeDraft>(emptyPurpose);

  // initial load
  useEffect(() => {
    const run = async () => {
      if (!API_URL || !id) { setErr("Missing API URL or id"); setLoading(false); return; }
      try {
        setLoading(true);
        setErr("");

        const dRes = await fetch(`${API_URL}/diasporas/${id}/`, { headers, cache: "no-store" });
        if (!dRes.ok) throw new Error(`Failed to load diaspora: ${dRes.status}`);
        const d: ApiDiaspora = await dRes.json();
        setDiaspora(d);

        // resolve user: serializer may embed user or only id
        let u: ApiUser | null = null;
        const uid = (typeof d.user === "object" && d.user && "id" in d.user)
          ? (d.user as ApiUser).id
          : d.user_id ?? (typeof d.user === "number" || typeof d.user === "string" ? d.user : null);

        if (typeof d.user === "object" && d.user) {
          u = d.user as ApiUser;
        } else if (uid != null) {
          const uRes = await fetch(`${API_URL}/users/${uid}/`, { headers, cache: "no-store" });
          if (uRes.ok) u = await uRes.json();
        }
        setUser(u);

        // set USER fields
        setFirstName(u?.first_name || "");
        setLastName(u?.last_name || "");
        setEmail(u?.email || "");

        // set DIASPORA fields
        setGender((d.gender as Gender) || "");
        setDob(d.dob || "");
        setPrimaryPhone(d.primary_phone || "");
        setWhatsapp(d.whatsapp || "");
        setCountryRes(d.country_of_residence || "Ethiopia");
        setCityRes(d.city_of_residence || "");
        setArrival(d.arrival_date || "");
        setStay(d.expected_stay_duration || "");
        setReturnee(!!d.is_returnee);
        setComms(d.communication_opt_in ?? true);
        setLocalAddr(d.address_local || "");
        setEmName(d.emergency_contact_name || "");
        setEmPhone(d.emergency_contact_phone || "");
        setPassport(d.passport_no || "");
        setIdNumber(d.id_number || "");
        const baseLang = d.preferred_language || "English";
        if (["English", "Amharic", "Oromic", "Harari", "Arabic"].includes(baseLang)) {
          setLang(baseLang);
          setLangOther("");
        } else {
          setLang("Other");
          setLangOther(baseLang);
        }

        // purposes — ONLY for this diaspora
        let ps: ApiPurpose[] = [];
        try {
          ps = await fetchAllPaginated<ApiPurpose>(`${API_URL}/purposes/?diaspora=${id}`, headers);
        } catch {
          ps = await fetchAllPaginated<ApiPurpose>(`${API_URL}/purposes/?diaspora_id=${id}`, headers);
        }
        ps = ps.filter((p) => String(p.diaspora) === String(id));
        setPurposes(ps);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Save handlers
  const [saving, setSaving] = useState(false);
  const saveAll = async () => {
    if (!API_URL || !diaspora) return;
    try {
      setSaving(true);
      setErr("");

      const preferredLanguage = lang === "Other" ? (langOther || "Other") : lang;

      // 1) Update USER (separate endpoint unless backend accepts nested updates)
      if (!SUPPORTS_NESTED_USER_UPDATE && user?.id != null) {
        const uPayload = {
          first_name: firstName || "",
          last_name: lastName || "",
          email: email || "",
          username: email || user?.username || email || "",
        };
        const uRes = await fetch(`${API_URL}/users/${user.id}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(uPayload),
        });
        if (!uRes.ok) throw new Error((await uRes.text()) || `Failed to update user: ${uRes.status}`);
      }

      // 2) Update DIASPORA
      const dPayload: any = {
        primary_phone: withPrefix("+251", primaryPhone) || null,
        gender: gender || null,
        dob: dob || null,
        whatsapp: withPrefix("+251", whatsapp) || null,
        country_of_residence: countryRes || null,
        city_of_residence: cityRes || null,
        arrival_date: arrival || null,
        expected_stay_duration: stay || null,
        is_returnee: !!returnee,
        preferred_language: preferredLanguage || "English",
        communication_opt_in: comms,
        address_local: localAddr || null,
        emergency_contact_name: emName || null,
        emergency_contact_phone: withPrefix("+251", emPhone) || null,
        passport_no: passport || null,
        id_number: idNumber || null,
      };

      if (SUPPORTS_NESTED_USER_UPDATE) {
        dPayload.user = {
          first_name: firstName || "",
          last_name: lastName || "",
          email: email || "",
          username: email || user?.username || email || "",
        };
      }

      const dRes = await fetch(`${API_URL}/diasporas/${diaspora.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(dPayload),
      });
      if (!dRes.ok) throw new Error((await dRes.text()) || `Failed to update diaspora: ${dRes.status}`);

      router.replace(`/diasporas/${diaspora.id}/view`);
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Purpose modal open helpers
  const openNewPurpose = () => {
    setPurposeDraft({ ...emptyPurpose, status: "DRAFT" });
    setPurposeModalOpen(true);
  };
  const openEditPurpose = (p: ApiPurpose) => {
    setPurposeDraft({
      id: p.id,
      type: p.type,
      description: p.description || "",
      sector: p.sector || "",
      sub_sector: p.sub_sector || "",
      investment_type: p.investment_type || "",
      estimated_capital:
        p.estimated_capital == null
          ? null
          : typeof p.estimated_capital === "string"
            ? Number(p.estimated_capital)
            : p.estimated_capital,
      currency: p.currency || "",
      jobs_expected: p.jobs_expected ?? null,
      land_requirement: !!p.land_requirement,
      land_size: p.land_size ?? null,
      preferred_location_note: p.preferred_location_note || "",
      status: p.status,
    });
    setPurposeModalOpen(true);
  };

  const refreshPurposes = async () => {
    if (!API_URL || !id) return;
    let ps: ApiPurpose[] = [];
    try {
      ps = await fetchAllPaginated<ApiPurpose>(`${API_URL}/purposes/?diaspora=${id}`, headers);
    } catch {
      ps = await fetchAllPaginated<ApiPurpose>(`${API_URL}/purposes/?diaspora_id=${id}`, headers);
    }
    ps = ps.filter((p) => String(p.diaspora) === String(id));
    setPurposes(ps);
  };

  const savePurpose = async () => {
    if (!API_URL || !diaspora) return;

    // Minimal validation
    if (!purposeDraft.type) {
      setErr("Please select a purpose type.");
      return;
    }

    const body: any = {
      diaspora: diaspora.id,
      type: purposeDraft.type,
      description: purposeDraft.description || "",
      sector: purposeDraft.sector || "",
      sub_sector: purposeDraft.sub_sector || "",
      investment_type: purposeDraft.investment_type || "",
      estimated_capital:
        purposeDraft.estimated_capital == null || Number.isNaN(purposeDraft.estimated_capital)
          ? null
          : Number(purposeDraft.estimated_capital),
      currency: purposeDraft.currency || "",
      jobs_expected:
        purposeDraft.jobs_expected == null || Number.isNaN(purposeDraft.jobs_expected)
          ? null
          : Number(purposeDraft.jobs_expected),
      land_requirement: !!purposeDraft.land_requirement,
      land_size:
        purposeDraft.land_size == null || Number.isNaN(purposeDraft.land_size)
          ? null
          : Number(purposeDraft.land_size),
      preferred_location_note: purposeDraft.preferred_location_note || "",
      status: purposeDraft.status || "DRAFT",
    };

    try {
      const isEdit = !!purposeDraft.id;
      const url = isEdit ? `${API_URL}/purposes/${purposeDraft.id}/` : `${API_URL}/purposes/`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.text()) || `Failed to ${isEdit ? "update" : "create"} purpose: ${res.status}`);

      await refreshPurposes();
      setPurposeModalOpen(false);
    } catch (e: any) {
      setErr(e?.message || "Failed to save purpose");
    }
  };

  const deletePurpose = async (pid: number | string) => {
    if (!API_URL) return;
    if (!confirm("Delete this purpose?")) return;
    try {
      const res = await fetch(`${API_URL}/purposes/${pid}/`, { method: "DELETE", headers });
      if (!res.ok && res.status !== 204) throw new Error((await res.text()) || `Failed to delete: ${res.status}`);
      await refreshPurposes();
    } catch (e: any) {
      setErr(e?.message || "Failed to delete purpose");
    }
  };

  /* -------------------- UI -------------------- */
  if (loading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (err) {
    return (
      <div className="p-6 text-center text-red-500 space-y-4">
        <div>{err}</div>
        <Button onClick={() => router.push(`/diasporas/${id}/view`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }
  if (!diaspora) {
    return (
      <div className="p-6 text-center text-red-500 space-y-4">
        <div>Could not load diaspora.</div>
        <Button onClick={() => router.push("/diasporas")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
      </div>
    );
  }

  const fullName = `${firstName} ${lastName}`.trim() || "—";
  const langList = ["English", "Amharic", "Oromic", "Harari", "Arabic", "Other"];
  const modalSubsectors = SECTORS[purposeDraft.sector || ""] || [];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb pageName="Edit Diaspora" />

      <Button
        variant="ghost"
        className="mb-2 flex items-center gap-2"
        onClick={() => router.push(`/diasporas/${diaspora.id}/view`)}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Button>

      {/* Profile (User + Diaspora) */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5" /> Basic Information
          </CardTitle>
          {isOfficer && (
            <Button className="bg-green-600 text-white hover:bg-green-700" onClick={saveAll} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* USER - names + email */}
          <div className="rounded-md border p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" /> User (Django)
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm">First name</label>
                <input className="mt-1 w-full rounded border p-2" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Last name</label>
                <input className="mt-1 w-full rounded border p-2" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Email</label>
                <input className="mt-1 w-full rounded border p-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </div>

          {/* DIASPORA core */}
          <div className="rounded-md border p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4" /> Contacts
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm">Primary phone (+251)</label>
                <PhoneInput value={primaryPhone} onChange={setPrimaryPhone} prefix="+251" />
              </div>
              <div>
                <label className="text-sm">WhatsApp (+251)</label>
                <PhoneInput value={whatsapp} onChange={setWhatsapp} prefix="+251" />
              </div>

              <div>
                <label className="text-sm">Gender</label>
                <select
                  className="mt-1 w-full rounded border p-2"
                  value={gender}
                  onChange={(e) => setGender((e.target.value || "") as Gender | "")}
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Date of birth
                </label>
                <input type="date" className="mt-1 w-full rounded border p-2" value={dob || ""} onChange={(e) => setDob(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-md border p-4 bg-gray-50 md:col-span-2">
            <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Residence & Travel
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="text-sm">Country of residence</label>
                <CountrySelect value={countryRes} onChange={setCountryRes} defaultToEthiopia />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">City of residence</label>
                <input className="mt-1 w-full rounded border p-2" value={cityRes} onChange={(e) => setCityRes(e.target.value)} />
              </div>

              <div>
                <label className="text-sm">Arrival date</label>
                <input type="date" className="mt-1 w-full rounded border p-2" value={arrival || ""} onChange={(e) => setArrival(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Expected stay duration</label>
                <input className="mt-1 w-full rounded border p-2" value={stay} onChange={(e) => setStay(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input id="returnee" type="checkbox" checked={returnee} onChange={(e) => setReturnee(e.target.checked)} />
                <label htmlFor="returnee" className="text-sm">Returnee</label>
              </div>

              <div>
                <label className="text-sm">Preferred language</label>
                <select className="mt-1 w-full rounded border p-2" value={lang} onChange={(e) => setLang(e.target.value)}>
                  {langList.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              {lang === "Other" && (
                <div>
                  <label className="text-sm">Specify language</label>
                  <input className="mt-1 w-full rounded border p-2" value={langOther} onChange={(e) => setLangOther(e.target.value)} />
                </div>
              )}
              <div className="flex items-center gap-2 mt-6">
                <input id="comms" type="checkbox" checked={comms} onChange={(e) => setComms(e.target.checked)} />
                <label htmlFor="comms" className="text-sm">Allow communications</label>
              </div>
            </div>
          </div>

          <div className="rounded-md border p-4 bg-gray-50 md:col-span-2">
            <div className="text-sm text-gray-600 mb-3">Address & Emergency</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-3">
                <label className="text-sm">Local address</label>
                <input className="mt-1 w-full rounded border p-2" value={localAddr} onChange={(e) => setLocalAddr(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Emergency contact name</label>
                <input className="mt-1 w-full rounded border p-2" value={emName} onChange={(e) => setEmName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Emergency contact phone (+251)</label>
                <PhoneInput value={emPhone} onChange={setEmPhone} prefix="+251" />
              </div>
            </div>
          </div>

          <div className="rounded-md border p-4 bg-gray-50 md:col-span-2">
            <div className="text-sm text-gray-600 mb-3">Documents</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="text-sm">Passport number</label>
                <input className="mt-1 w-full rounded border p-2" value={passport} onChange={(e) => setPassport(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">ID number</label>
                <input className="mt-1 w-full rounded border p-2" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purposes manager (THIS diaspora only) */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Purposes ({purposes.length})
          </CardTitle>
          {isOfficer && (
            <Button variant="outline" onClick={openNewPurpose}>Add Purpose</Button>
          )}
        </CardHeader>
        <CardContent>
          {purposes.length === 0 ? (
            <div className="text-sm text-gray-500">No purposes found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sector / Sub-sector</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>Capital</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purposes.map((p) => {
                  const cap =
                    p.estimated_capital == null || p.estimated_capital === ""
                      ? "—"
                      : `${Number(p.estimated_capital).toLocaleString()} ${p.currency || ""}`.trim();
                  return (
                    <TableRow key={String(p.id)}>
                      <TableCell className="font-medium">{purposeTypeLabel[p.type] || p.type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${purposeStatusPill[p.status] || "bg-gray-100"}`}>
                          {p.status.replaceAll("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {[pretty(p.sector), pretty(p.sub_sector)]
                          .filter((x) => x !== "—")
                          .join(" / ") || "—"}
                      </TableCell>
                      <TableCell>{pretty(p.investment_type)}</TableCell>
                      <TableCell>{cap}</TableCell>
                      <TableCell>{p.jobs_expected ?? "—"}</TableCell>
                      <TableCell>{p.land_requirement ? (p.land_size ? `Yes — ${p.land_size} m²` : "Yes") : "No"}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" onClick={() => openEditPurpose(p)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => deletePurpose(p.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Purpose Modal (scrollable) */}
      <AnimatedModal
        open={purposeModalOpen}
        onClose={() => setPurposeModalOpen(false)}
        title={purposeDraft.id ? "Edit Purpose" : "Add Purpose"}
        maxWidthClassName="max-w-2xl"
      >
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm">Purpose type *</label>
                <select
                  className="mt-1 w-full rounded border p-2"
                  value={purposeDraft.type || ""}
                  onChange={(e) => setPurposeDraft({ ...purposeDraft, type: (e.target.value || "") as PurposeType })}
                >
                  <option value="">Select</option>
                  <option value="INVESTMENT">Investment</option>
                  <option value="TOURISM">Tourism</option>
                  <option value="FAMILY">Family</option>
                  <option value="STUDY">Study</option>
                  <option value="CHARITY_NGO">Charity/NGO</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm">Status</label>
                <select
                  className="mt-1 w-full rounded border p-2"
                  value={purposeDraft.status || "DRAFT"}
                  onChange={(e) => setPurposeDraft({ ...purposeDraft, status: e.target.value as ApiPurpose["status"] })}
                >
                  {["DRAFT","SUBMITTED","UNDER_REVIEW","APPROVED","REJECTED","ON_HOLD"].map(s => (
                    <option key={s} value={s}>{s.replaceAll("_"," ")}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm">Description</label>
                <textarea
                  className="mt-1 w-full rounded border p-2 min-h-[90px]"
                  placeholder="Describe the purpose…"
                  value={purposeDraft.description || ""}
                  onChange={(e) => setPurposeDraft({ ...purposeDraft, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm">Sector</label>
                <select
                  className="mt-1 w-full rounded border p-2"
                  value={purposeDraft.sector || ""}
                  onChange={(e) => setPurposeDraft({ ...purposeDraft, sector: e.target.value, sub_sector: "" })}
                >
                  <option value="">Select sector</option>
                  {Object.keys(SECTORS).map((sec) => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm">Sub-sector</label>
                <select
                  className="mt-1 w-full rounded border p-2"
                  value={purposeDraft.sub_sector || ""}
                  onChange={(e) => setPurposeDraft({ ...purposeDraft, sub_sector: e.target.value })}
                  disabled={!purposeDraft.sector}
                >
                  <option value="">{purposeDraft.sector ? "Select sub-sector" : "Select a sector first"}</option>
                  {(SECTORS[purposeDraft.sector || ""] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm">Investment type</label>
                <select
                  className="mt-1 w-full rounded border p-2"
                  value={purposeDraft.investment_type || ""}
                  onChange={(e) => setPurposeDraft({ ...purposeDraft, investment_type: e.target.value })}
                >
                  <option value="">Select</option>
                  {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm">Estimated capital</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  value={purposeDraft.estimated_capital ?? ""}
                  onChange={(e) =>
                    setPurposeDraft({
                      ...purposeDraft,
                      estimated_capital: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Currency</label>
                <select
                  className="mt-1 w-full rounded border p-2"
                  value={purposeDraft.currency || ""}
                  onChange={(e) => setPurposeDraft({ ...purposeDraft, currency: e.target.value })}
                >
                  <option value="">Select</option>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm">Expected jobs</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  value={purposeDraft.jobs_expected ?? ""}
                  onChange={(e) =>
                    setPurposeDraft({
                      ...purposeDraft,
                      jobs_expected: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  id="land_req"
                  type="checkbox"
                  checked={!!purposeDraft.land_requirement}
                  onChange={(e) => setPurposeDraft({ ...purposeDraft, land_requirement: e.target.checked })}
                />
                <label htmlFor="land_req" className="text-sm">Land requirement</label>
              </div>

              {purposeDraft.land_requirement && (
                <div>
                  <label className="text-sm">Land size (m²)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded border p-2"
                    value={purposeDraft.land_size ?? ""}
                    onChange={(e) =>
                      setPurposeDraft({
                        ...purposeDraft,
                        land_size: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-sm">Preferred location note</label>
                <input
                  className="mt-1 w-full rounded border p-2"
                  value={purposeDraft.preferred_location_note || ""}
                  onChange={(e) => setPurposeDraft({ ...purposeDraft, preferred_location_note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPurposeModalOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={savePurpose}>
                {purposeDraft.id ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </AnimatedModal>

      {/* Footer Save for visibility on mobile */}
      {isOfficer && (
        <div className="sticky bottom-4 flex justify-end">
          <Button className="bg-green-600 text-white hover:bg-green-700 shadow-lg" onClick={saveAll} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
