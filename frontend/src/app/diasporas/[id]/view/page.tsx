"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, Phone, User, MapPin, Calendar, Shield, Hash, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/* ================== Types aligned to your backend ================== */
type UserSlim = {
  id: number | string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
};

type ApiDiasporaRead = {
  id: string;                    // UUID
  diaspora_id: string;
  user?: UserSlim | null;        // from DiasporaSerializer
  full_name?: string | null;     // read-only field in your serializer

  gender?: "MALE" | "FEMALE" | "OTHER" | null;
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
  type: "INVESTMENT" | "TOURISM" | "FAMILY" | "STUDY" | "CHARITY_NGO" | "OTHER";
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

type ApiCase = {
  id: number | string;
  diaspora: string; // Diaspora.id (UUID)
  current_stage: "INTAKE" | "SCREENING" | "REFERRAL" | "PROCESSING" | "COMPLETED" | "CLOSED";
  overall_status: "ACTIVE" | "PAUSED" | "DONE" | "REJECTED";
  created_at?: string;
  updated_at?: string;
};

type ApiReferral = {
  id: number | string;
  case: number | string;
  from_office: number | string;
  to_office: number | string;
  reason?: string;
  status: "SENT" | "RECEIVED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  received_at?: string | null;
  completed_at?: string | null;
  sla_due_at?: string | null;
  created_at?: string;
};

/* ================== Small helpers ================== */
const pretty = (v?: string | null) => (v && String(v).trim().length ? v : "—");
const fmtDate = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "—");

const genderLabel: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
const purposeLabel: Record<string, string> = {
  INVESTMENT: "Investment",
  TOURISM: "Tourism",
  FAMILY: "Family",
  STUDY: "Study",
  CHARITY_NGO: "Charity / NGO",
  OTHER: "Other",
};
const purposePill: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  ON_HOLD: "bg-purple-100 text-purple-800",
};

const caseStageLabel: Record<ApiCase["current_stage"], string> = {
  INTAKE: "Intake",
  SCREENING: "Screening",
  REFERRAL: "Referral",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};
const caseStatusPill: Record<ApiCase["overall_status"], string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  DONE: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const referralPill: Record<ApiReferral["status"], string> = {
  SENT: "bg-gray-100 text-gray-800",
  RECEIVED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

async function fetchAllPaginated<T>(url: string, headers: Record<string, string>) {
  let next: string | null = url;
  const all: T[] = [];
  while (next) {
    const res = await fetch(next, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} on ${next}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      all.push(...data);
      next = null;
    } else if (Array.isArray((data as any)?.results)) {
      all.push(...(data as any).results);
      next = (data as any).next || null;
    } else {
      // list endpoint returned single object (unlikely) -> ignore paging
      all.push(data);
      next = null;
    }
  }
  return all;
}

/* ================== Page ================== */
export default function DiasporaViewPage() {
  const { id } = useParams(); // diaspora uuid (matches Diaspora.id)
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // who is logged in (for gating the Edit button)
  const groupsRaw = typeof window !== "undefined" ? localStorage.getItem("user_groups") : "[]";
  const groups: string[] = useMemo(() => {
    try {
      const parsed = JSON.parse(groupsRaw || "[]");
      return (Array.isArray(parsed) ? parsed : [])
        .map((g) => (typeof g === "string" ? g : g?.name))
        .filter(Boolean);
    } catch {
      return [];
    }
  }, [groupsRaw]);
  const isOfficer = groups.includes("Officer");

  // Data
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [d, setD] = useState<ApiDiasporaRead | null>(null);
  const [purposes, setPurposes] = useState<ApiPurpose[]>([]);
  const [caseObj, setCaseObj] = useState<ApiCase | null>(null);
  const [referrals, setReferrals] = useState<ApiReferral[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!API_URL || !id) {
        setErr("Missing API URL or id");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErr("");

        // 1) Profile (single object)
        const res = await fetch(`${API_URL}/diasporas/${id}/`, { headers, cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load profile: ${res.status}`);
        const diaspora: ApiDiasporaRead = await res.json();
        setD(diaspora);

        // 2) Purposes for THIS diaspora only
        // Try both common query names: ?diaspora= and ?diaspora_id=
        let purposesList: ApiPurpose[] = [];
        try {
          purposesList = await fetchAllPaginated<ApiPurpose>(`${API_URL}/purposes/?diaspora=${id}`, headers);
        } catch {
          purposesList = await fetchAllPaginated<ApiPurpose>(`${API_URL}/purposes/?diaspora_id=${id}`, headers);
        }
        // Ensure we only keep items truly belonging to this diaspora id
        purposesList = purposesList.filter((p) => String(p.diaspora) === String(id));
        setPurposes(purposesList);

        // 3) Case (OneToOne) — fetch by diaspora id; handle both filter names
        let caseList: ApiCase[] = [];
        try {
          caseList = await fetchAllPaginated<ApiCase>(`${API_URL}/cases/?diaspora=${id}`, headers);
        } catch {
          caseList = await fetchAllPaginated<ApiCase>(`${API_URL}/cases/?diaspora_id=${id}`, headers);
        }
        // pick the (only) case for this diaspora, if any
        const theCase = (caseList.find((c) => String(c.diaspora) === String(id)) || caseList[0]) ?? null;
        setCaseObj(theCase);

        // 4) Referrals for that case
        if (theCase?.id != null) {
          const refs = await fetchAllPaginated<ApiReferral>(
            `${API_URL}/referrals/?case=${theCase.id}`,
            headers
          );
          setReferrals(refs);
        } else {
          setReferrals([]);
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading…</div>;
  }
  if (err) {
    return (
      <div className="p-6 text-center text-red-500 space-y-4">
        <div>{err}</div>
        <Button onClick={() => router.push("/diasporas")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }
  if (!d) {
    return (
      <div className="p-6 text-center text-red-500 space-y-4">
        <div>Diaspora not found.</div>
        <Button onClick={() => router.push("/diasporas")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  // Name/email from nested user (fallback to full_name provided by serializer)
  const firstName = d.user?.first_name || "";
  const lastName  = d.user?.last_name  || "";
  const email     = d.user?.email      || "";
  const fullName  =
    (d.full_name && d.full_name.trim()) ||
    `${firstName} ${lastName}`.trim() ||
    "—";

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" className="mb-2 flex items-center gap-2" onClick={() => router.push("/diasporas")}>
        <ArrowLeft className="h-4 w-4" /> Back to List
      </Button>

      {/* Profile */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5" /> Profile
          </CardTitle>
          {isOfficer && (
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => router.push(`/diasporas/${d.id}/edit`)}>
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
          <div className="rounded-md border p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-gray-500">Diaspora ID</span>
              <span className="font-medium flex items-center gap-2"><Hash className="h-4 w-4" /> {pretty(d.diaspora_id)}</span>

              <span className="text-gray-500">Full name</span>
              <span className="font-medium">{fullName}</span>

              <span className="text-gray-500">Gender</span>
              <span className="font-medium">{d.gender ? genderLabel[d.gender] : "—"}</span>

              <span className="text-gray-500">Date of birth</span>
              <span className="font-medium flex items-center gap-2"><Calendar className="h-4 w-4" /> {fmtDate(d.dob)}</span>

              <span className="text-gray-500">Email</span>
              <span className="font-medium flex items-center gap-2"><Mail className="h-4 w-4" /> {pretty(email)}</span>

              <span className="text-gray-500">Primary phone</span>
              <span className="font-medium flex items-center gap-2"><Phone className="h-4 w-4" /> {pretty(d.primary_phone)}</span>

              <span className="text-gray-500">WhatsApp</span>
              <span className="font-medium">{pretty(d.whatsapp)}</span>

              <span className="text-gray-500">Preferred language</span>
              <span className="font-medium">{pretty(d.preferred_language)}</span>

              <span className="text-gray-500">Comms Opt-in</span>
              <span className="font-medium">{d.communication_opt_in ? "Allowed" : "No"}</span>
            </div>
          </div>

          <div className="rounded-md border p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-gray-500">Residence</span>
              <span className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {[pretty(d.country_of_residence), pretty(d.city_of_residence)]
                  .filter((x) => x !== "—")
                  .join(", ") || "—"}
              </span>

              <span className="text-gray-500">Arrival date</span>
              <span className="font-medium">{fmtDate(d.arrival_date)}</span>

              <span className="text-gray-500">Expected stay</span>
              <span className="font-medium">{pretty(d.expected_stay_duration)}</span>

              <span className="text-gray-500">Returnee</span>
              <span className="font-medium">{d.is_returnee ? "Yes" : "No"}</span>

              <span className="text-gray-500">Local address</span>
              <span className="font-medium">{pretty(d.address_local)}</span>

              <span className="text-gray-500">Emergency contact</span>
              <span className="font-medium">
                {[pretty(d.emergency_contact_name), pretty(d.emergency_contact_phone)]
                  .filter((x) => x !== "—")
                  .join(" / ") || "—"}
              </span>

              <span className="text-gray-500">Passport No.</span>
              <span className="font-medium">{pretty(d.passport_no)}</span>

              <span className="text-gray-500">ID Number</span>
              <span className="font-medium">{pretty(d.id_number)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purposes — ONLY for this diaspora */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Purposes ({purposes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purposes.length === 0 ? (
            <div className="text-sm text-gray-500">No purposes recorded.</div>
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
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purposes.map((p) => (
                  <TableRow key={String(p.id)}>
                    <TableCell className="font-medium">{purposeLabel[p.type] || p.type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${purposePill[p.status] || "bg-gray-100"}`}>
                        {p.status.replaceAll("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {[pretty(p.sector), pretty(p.sub_sector)].filter((x) => x !== "—").join(" / ") || "—"}
                    </TableCell>
                    <TableCell>{pretty(p.investment_type)}</TableCell>
                    <TableCell>
                      {p.estimated_capital != null && p.estimated_capital !== ""
                        ? `${Number(p.estimated_capital).toLocaleString()} ${p.currency || ""}`.trim()
                        : "—"}
                    </TableCell>
                    <TableCell>{p.jobs_expected ?? "—"}</TableCell>
                    <TableCell>
                      {p.land_requirement ? <>Yes{p.land_size ? ` — ${p.land_size} m²` : ""}</> : "No"}
                    </TableCell>
                    <TableCell>{fmtDate(p.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Case (OneToOne) — ONLY for this diaspora */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5" /> Case
          </CardTitle>
          {isOfficer && caseObj && (
            <Button onClick={() => router.push(`/cases/${caseObj.id}/view`)}>Open Case</Button>
          )}
        </CardHeader>
        <CardContent>
          {!caseObj ? (
            <div className="text-sm text-gray-500">No case has been opened for this diaspora yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
              <div className="rounded-md border p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Case ID</span>
                  <span className="font-medium">{String(caseObj.id)}</span>

                  <span className="text-gray-500">Stage</span>
                  <span className="font-medium">{caseStageLabel[caseObj.current_stage]}</span>

                  <span className="text-gray-500">Overall Status</span>
                  <span className="font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${caseStatusPill[caseObj.overall_status]}`}>
                      {caseObj.overall_status.replaceAll("_", " ")}
                    </span>
                  </span>

                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">{fmtDate(caseObj.created_at)}</span>

                  <span className="text-gray-500">Updated</span>
                  <span className="font-medium">{fmtDate(caseObj.updated_at)}</span>
                </div>
              </div>

              {/* Simple stage progress */}
              <div className="rounded-md border p-4 bg-gray-50">
                <div className="text-gray-500 mb-2">Stage Progress</div>
                <div className="flex items-center gap-2">
                  {["INTAKE","SCREENING","REFERRAL","PROCESSING","COMPLETED","CLOSED"].map((st, idx, arr) => {
                    const activeIdx = arr.indexOf(caseObj.current_stage);
                    const done = idx <= activeIdx;
                    return (
                      <div key={st} className="flex items-center">
                        <div className={`h-3 w-3 rounded-full ${done ? "bg-green-600" : "bg-gray-300"}`} />
                        {idx < arr.length - 1 && (
                          <div className={`mx-2 h-[3px] w-10 rounded ${idx < activeIdx ? "bg-green-500" : "bg-gray-300"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {caseStageLabel[caseObj.current_stage]}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referrals — ONLY those tied to the case above */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Referrals ({referrals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-sm text-gray-500">No referrals available.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>From Office</TableHead>
                  <TableHead>To Office</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>SLA Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r) => (
                  <TableRow key={String(r.id)}>
                    <TableCell className="font-medium">{String(r.id)}</TableCell>
                    <TableCell>{String(r.case)}</TableCell>
                    <TableCell>{String(r.from_office)}</TableCell>
                    <TableCell>{String(r.to_office)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${referralPill[r.status] || "bg-gray-100"}`}>
                        {r.status.replaceAll("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate" title={r.reason || ""}>
                      {pretty(r.reason)}
                    </TableCell>
                    <TableCell>{fmtDate(r.received_at)}</TableCell>
                    <TableCell>{fmtDate(r.completed_at)}</TableCell>
                    <TableCell>{fmtDate(r.sla_due_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
