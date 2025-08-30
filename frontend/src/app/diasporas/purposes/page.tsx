"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Eye, Pencil, Plus, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { SuccessModal } from "@/components/ui/success-modal";

/* ========= Purpose enums ========= */
const PURPOSE_TYPES = ["INVESTMENT","TOURISM","FAMILY","STUDY","CHARITY_NGO","OTHER"] as const;
const PURPOSE_TYPE_LABEL: Record<string,string> = {
  INVESTMENT: "Investment",
  TOURISM: "Tourism",
  FAMILY: "Family",
  STUDY: "Study",
  CHARITY_NGO: "Charity/NGO",
  OTHER: "Other",
};
const PURPOSE_STATUS = ["DRAFT","SUBMITTED","UNDER_REVIEW","APPROVED","REJECTED","ON_HOLD"] as const;
const PURPOSE_STATUS_LABEL: Record<string,string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ON_HOLD: "On Hold",
};
const purposePill: Record<string,string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  ON_HOLD: "bg-purple-100 text-purple-800",
};

/* ========= Domain options ========= */
const SECTORS = {
  "Agriculture & Agro-Processing": [
    "Agro-processing & value addition",
    "Agri-tech & irrigation solutions",
  ],
  "Manufacturing & Industry": [
    "Textiles & garment production",
    "Construction materials",
  ],
} as const;

const INVESTMENT_TYPES = ["new company", "JV", "expansion"] as const;
const CURRENCIES = ["USD", "ETB", "EUR"] as const;

/* ========= API Types ========= */
type ApiDiasporaLite = {
  id: string; diaspora_id?: string;
  first_name?: string; last_name?: string;
  email?: string; primary_phone?: string;
};

type ApiPurpose = {
  id: number | string;
  diaspora: string; // FK id
  type: typeof PURPOSE_TYPES[number];
  description?: string;
  sector?: string | null;
  sub_sector?: string | null;
  investment_type?: string | null;
  estimated_capital?: string | number | null;
  currency?: string | null;
  jobs_expected?: number | null;
  land_requirement?: boolean | null;
  land_size?: number | null;
  preferred_location_note?: string | null;
  status: typeof PURPOSE_STATUS[number];
  created_at?: string;
};

type Row = {
  id: string | number;
  diaspora_id: string;
  diaspora_name: string;
  type: typeof PURPOSE_TYPES[number];
  sector: string;
  status: typeof PURPOSE_STATUS[number];
};

/* ========= Page ========= */
export default function PurposesPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userGroupsRaw = typeof window !== "undefined" ? localStorage.getItem("user_groups") : "[]";
  const currentUserGroups: string[] = useMemo(() => {
    try {
      const parsed = JSON.parse(userGroupsRaw || "[]");
      return Array.isArray(parsed)
        ? parsed.map((g: any) => (typeof g === "string" ? g : g?.name)).filter(Boolean)
        : [];
    } catch { return []; }
  }, [userGroupsRaw]);
  const isDiasporaUser = currentUserGroups.includes("Diaspora");
  const myDiasporaId = typeof window !== "undefined" ? localStorage.getItem("diaspora_id") : null;

  // table state
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // filters: type/status + search by diaspora name
  const [typeFilter,   setTypeFilter]   = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search,       setSearch]       = useState("");

  // success toast
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg,  setSuccessMsg]  = useState("");

  /** Fetch ALL pages helper */
  const fetchAllPaginated = async <T,>(startUrl: string, headers: Record<string,string>): Promise<T[]> => {
    let all: T[] = [];
    let nextUrl: string | null = startUrl;
    while (nextUrl) {
      const res = await fetch(nextUrl, { headers, cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        all = all.concat(data as T[]);
        nextUrl = null;
      } else if (Array.isArray((data as any)?.results)) {
        all = all.concat((data as any).results as T[]);
        nextUrl = (data as any).next || null;
      } else {
        nextUrl = null;
      }
    }
    return all;
  };

  const diasporaNameFrom = (d?: ApiDiasporaLite) =>
    d ? ([d.first_name, d.last_name].filter(Boolean).join(" ").trim() || d.email || d.diaspora_id || String(d.id)) : "—";

  /** Load purposes and resolve diaspora names */
  const loadPurposes = async () => {
    if (!API_URL || !token) return;
    try {
      setLoading(true); setError("");
      const headers = { Authorization: `Bearer ${token}` };

      // Get all purposes
      let list = await fetchAllPaginated<ApiPurpose>(`${API_URL}/purposes/`, headers);

      // If diaspora user, filter to their id
      if (isDiasporaUser && myDiasporaId) {
        list = list.filter(p => String(p.diaspora) === String(myDiasporaId));
      }

      // Resolve diaspora labels
      const ids = Array.from(new Set(list.map(p => String(p.diaspora))));
      const diasporaMap: Record<string, ApiDiasporaLite> = {};

      // Batch fetch diasporas (simple fanout)
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`${API_URL}/diasporas/${encodeURIComponent(id)}/`, { headers, cache: "no-store" });
            if (res.ok) {
              const d = await res.json();
              diasporaMap[id] = d?.user
                ? { id: String(d.id), first_name: d.user.first_name, last_name: d.user.last_name, email: d.user.email, diaspora_id: d.diaspora_id }
                : { id: String(d.id), diaspora_id: d.diaspora_id };
            }
          } catch {}
        })
      );

      const rows: Row[] = list.map((p) => ({
        id: p.id,
        diaspora_id: String(p.diaspora),
        diaspora_name: diasporaNameFrom(diasporaMap[String(p.diaspora)]),
        type: p.type,
        sector: p.sector || "",
        status: p.status,
      }));

      setRows(rows);
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPurposes(); /* eslint-disable react-hooks/exhaustive-deps */ }, []);

  // Filters
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchType   = typeFilter   === "all" || r.type   === typeFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchSearch = !term || [r.diaspora_name, r.sector, PURPOSE_TYPE_LABEL[r.type], PURPOSE_STATUS_LABEL[r.status]]
        .join(" ")
        .toLowerCase()
        .includes(term);
      return matchType && matchStatus && matchSearch;
    });
  }, [rows, typeFilter, statusFilter, search]);

  /* ========================= Create Purpose Modal state ========================= */
  const [purposeOpen,   setPurposeOpen]   = useState(false);
  const [purposeSaving, setPurposeSaving] = useState(false);
  const [purposeErr,    setPurposeErr]    = useState("");

  const [pform, setPForm] = useState<{
    diaspora: string;           // FK id string
    diasporaLabel?: string;     // UI only
    diasporaSearch: string;
    diasporaOptions: ApiDiasporaLite[];

    type: typeof PURPOSE_TYPES[number] | "";
    description: string;
    sector: string;             // optional
    sub_sector: string;         // optional
    investment_type: string;    // optional
    estimated_capital: string;  // decimal string (optional)
    currency: string;           // optional
    jobs_expected: string;      // optional
    land_requirement: boolean;
    land_size: string;          // optional
    preferred_location_note: string;
    status: typeof PURPOSE_STATUS[number];
  }>({
    diaspora: myDiasporaId ? String(myDiasporaId) : "",
    diasporaLabel: undefined,
    diasporaSearch: "",
    diasporaOptions: [],

    type: "INVESTMENT",
    description: "",
    sector: "",
    sub_sector: "",
    investment_type: "",
    estimated_capital: "",
    currency: "ETB",
    jobs_expected: "",
    land_requirement: false,
    land_size: "",
    preferred_location_note: "",
    status: "SUBMITTED",
  });

  const openCreatePurpose = () => {
    setPurposeErr("");
    setPForm((s) => ({
      ...s,
      diaspora: myDiasporaId ? String(myDiasporaId) : "",
      diasporaLabel: undefined,
      diasporaSearch: "",
      diasporaOptions: [],
      type: "INVESTMENT",
      description: "",
      sector: "",
      sub_sector: "",
      investment_type: "",
      estimated_capital: "",
      currency: "ETB",
      jobs_expected: "",
      land_requirement: false,
      land_size: "",
      preferred_location_note: "",
      status: "SUBMITTED",
    }));
    setPurposeOpen(true);
  };

  // Diaspora search for the purpose modal
  useEffect(() => {
    if (!purposeOpen) return;
    const q = pform.diasporaSearch.trim();
    const t = setTimeout(async () => {
      if (!API_URL || !token) return;
      try {
        const url = new URL(`${API_URL}/diasporas/`);
        if (q) url.searchParams.set("search", q);
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const list: ApiDiasporaLite[] = Array.isArray(data) ? data : data?.results || [];
        setPForm((s) => ({ ...s, diasporaOptions: list.slice(0, 12) }));
      } catch {}
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pform.diasporaSearch, purposeOpen]);

  // Submit create Purpose
  const submitPurpose = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurposeErr("");
    if (!API_URL) return setPurposeErr("NEXT_PUBLIC_API_URL is not set");
    if (!token) return setPurposeErr("You are not authenticated.");
    if (!pform.diaspora) return setPurposeErr("Please select a diaspora.");
    if (!pform.type) return setPurposeErr("Purpose type is required.");

    try {
      setPurposeSaving(true);

      const payload: Record<string, any> = {
        diaspora: pform.diaspora, // FK field (change to 'diaspora_id' if your API expects that)
        type: pform.type,
        description: pform.description || "",
        sector: pform.sector || null,
        sub_sector: pform.sub_sector || null,
        investment_type: pform.investment_type || null,
        estimated_capital: pform.estimated_capital ? pform.estimated_capital : null,
        currency: pform.currency || null,
        jobs_expected: pform.jobs_expected ? Number(pform.jobs_expected) : null,
        land_requirement: !!pform.land_requirement,
        land_size: pform.land_requirement && pform.land_size ? Number(pform.land_size) : null,
        preferred_location_note: pform.preferred_location_note || null,
        status: pform.status,
      };

      const res = await fetch(`${API_URL}/purposes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.text()) || `Create purpose failed: ${res.status}`);

      setPurposeOpen(false);
      setSuccessMsg("Purpose created successfully.");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 3000);
      await loadPurposes();
    } catch (err: any) {
      setPurposeErr(err?.message || "Failed to create purpose");
    } finally {
      setPurposeSaving(false);
    }
  };
  console.log()
  /* ========================= Render ========================= */
  return (
    <>
      <Breadcrumb pageName="Purposes" />

      <div className={cn("rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark dark:shadow-card")}>
        {/* Filters & Add */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {/* Purpose Type filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Purpose Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purpose Types</SelectItem>
                {PURPOSE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{PURPOSE_TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Purpose Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Purpose Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purpose Statuses</SelectItem>
                {PURPOSE_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>{PURPOSE_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Search diaspora / sector…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[280px]"
            />
          </div>

          {!isDiasporaUser && (
            <Button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={openCreatePurpose}
            >
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Button>
          )}
        </div>

        {/* Table: Diaspora, Type, Sector, Status, Action */}
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:text-center">
              <TableHead className="!text-left">Diaspora</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-300">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!!error && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center text-red-500">{error}</TableCell>
              </TableRow>
            )}
            {!loading && !error && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-300">
                  No purposes found
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && filtered.map((r) => (
              <TableRow key={r.id} className="text-center text-base font-medium text-dark dark:text-white">
                <TableCell className="!text-left">
                  <div className="flex flex-col">
                    <span>{r.diaspora_name}</span>
                    <span className="text-xs text-gray-500">ID: {r.diaspora_id}</span>
                  </div>
                </TableCell>
                <TableCell>{PURPOSE_TYPE_LABEL[r.type]}</TableCell>
                <TableCell>{r.sector || "—"}</TableCell>
                <TableCell>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", purposePill[r.status] || "bg-gray-100")}>
                    {PURPOSE_STATUS_LABEL[r.status]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => router.push(`/diasporas/${r.diaspora_id}/view`)}>
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Button>
                    {!isDiasporaUser && (
                      <Button size="icon" variant="ghost" onClick={() => router.push(`/diasporas/${r.diaspora_id}/edit`)}>
                        <Pencil className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ========================= Create Purpose Modal ========================= */}
      <AnimatedModal
        open={purposeOpen}
        onClose={() => { if (!purposeSaving) setPurposeOpen(false); }}
        title="Create Purpose"
        maxWidthClassName="max-w-3xl"
        disableBackdropClose={purposeSaving}
      >
        <form onSubmit={submitPurpose} className="space-y-4">
          {/* Scrollable inner content */}
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            {/* Diaspora picker */}
            <div className="mb-2">
              <label className="mb-1 block text-sm font-medium">Select Diaspora</label>

              {pform.diaspora && (
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                  <Check className="h-3 w-3" />
                  <span>Selected</span>
                  {pform.diasporaLabel ? <span className="font-medium">· {pform.diasporaLabel}</span> : null}
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => setPForm((s) => ({ ...s, diaspora: "", diasporaLabel: undefined }))}
                  >
                    change
                  </button>
                </div>
              )}

              <Input
                placeholder="Search name, email, phone, or diaspora ID"
                value={pform.diasporaSearch}
                onChange={(e) => setPForm((s) => ({ ...s, diasporaSearch: e.target.value }))}
              />

              {pform.diasporaOptions.length > 0 && (
                <div className="mt-2 max-h-56 overflow-auto rounded border border-gray-200 dark:border-dark-3">
                  {pform.diasporaOptions.map((d) => {
                    const label =
                      [d.first_name, d.last_name].filter(Boolean).join(" ").trim() ||
                      d.email || d.diaspora_id || d.id;
                    const idStr = String(d.id);
                    const selected = String(pform.diaspora) === idStr;
                    return (
                      <button
                        key={idStr}
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-dark-2",
                          selected && "bg-blue-50 dark:bg-dark-2"
                        )}
                        onClick={() => setPForm((s) => ({ ...s, diaspora: idStr, diasporaLabel: label }))}
                      >
                        <span className="truncate">{label}</span>
                        <span className="text-xs text-gray-500">ID: {d.diaspora_id || d.id}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Purpose Type (required) */}
            <div>
              <label className="mb-1 block text-sm font-medium">Purpose Type</label>
              <Select
                value={pform.type || ""}
                onValueChange={(v) => setPForm((s) => ({ ...s, type: v as typeof PURPOSE_TYPES[number] }))}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="z-[10002]" position="popper" sideOffset={6}>
                  {PURPOSE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{PURPOSE_TYPE_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                rows={3}
                value={pform.description}
                onChange={(e) => setPForm((s) => ({ ...s, description: e.target.value }))}
                className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
                placeholder="Describe purpose..."
              />
            </div>

            {/* Sector & Sub-sector (linked). NOTE: no empty SelectItem; use Clear link */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1 block text-sm font-medium">Sector</label>
                  {pform.sector && (
                    <button
                      type="button"
                      className="text-xs underline text-gray-500"
                      onClick={() => setPForm((s) => ({ ...s, sector: "", sub_sector: "" }))}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <Select
                  value={pform.sector || ("" as any)}
                  onValueChange={(v) => setPForm((s) => ({ ...s, sector: v, sub_sector: "" }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                  <SelectContent className="z-[10002]" position="popper" sideOffset={6}>
                    {Object.keys(SECTORS).map((sec) => (
                      <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1 block text-sm font-medium">Sub-sector</label>
                  {pform.sub_sector && (
                    <button
                      type="button"
                      className="text-xs underline text-gray-500"
                      onClick={() => setPForm((s) => ({ ...s, sub_sector: "" }))}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <Select
                  value={pform.sub_sector || ("" as any)}
                  onValueChange={(v) => setPForm((s) => ({ ...s, sub_sector: v }))}
                  disabled={!pform.sector}
                >
                  <SelectTrigger><SelectValue placeholder="Select sub-sector" /></SelectTrigger>
                  <SelectContent className="z-[10002]" position="popper" sideOffset={6}>
                    {(SECTORS[pform.sector as keyof typeof SECTORS] || []).map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Investment type, Estimated capital, Currency, Jobs */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1 block text-sm font-medium">Investment Type</label>
                  {pform.investment_type && (
                    <button
                      type="button"
                      className="text-xs underline text-gray-500"
                      onClick={() => setPForm((s) => ({ ...s, investment_type: "" }))}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <Select
                  value={pform.investment_type || ("" as any)}
                  onValueChange={(v) => setPForm((s) => ({ ...s, investment_type: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent className="z-[10002]" position="popper" sideOffset={6}>
                    {INVESTMENT_TYPES.map((x) => (
                      <SelectItem key={x} value={x}>{x}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Estimated Capital</label>
                <Input
                  type="number"
                  step="0.01"
                  value={pform.estimated_capital}
                  onChange={(e) => setPForm((s) => ({ ...s, estimated_capital: e.target.value }))}
                  placeholder="e.g. 1000000"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1 block text-sm font-medium">Currency</label>
                </div>
                <Select
                  value={pform.currency || ("" as any)}
                  onValueChange={(v) => setPForm((s) => ({ ...s, currency: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent className="z-[10002]" position="popper" sideOffset={6}>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Jobs Expected</label>
                <Input
                  type="number"
                  value={pform.jobs_expected}
                  onChange={(e) => setPForm((s) => ({ ...s, jobs_expected: e.target.value }))}
                  placeholder="e.g. 25"
                />
              </div>
            </div>

            {/* Land requirement + Land size */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <input
                  id="land_req"
                  type="checkbox"
                  checked={!!pform.land_requirement}
                  onChange={(e) =>
                    setPForm((s) => ({ ...s, land_requirement: e.target.checked, land_size: e.target.checked ? s.land_size : "" }))
                  }
                />
                <label htmlFor="land_req" className="text-sm">Land requirement</label>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Land size (m²)</label>
                <Input
                  type="number"
                  value={pform.land_size}
                  onChange={(e) => setPForm((s) => ({ ...s, land_size: e.target.value }))}
                  placeholder="e.g. 5000"
                  disabled={!pform.land_requirement}
                />
              </div>
            </div>

            {/* Preferred location note */}
            <div>
              <label className="mb-1 block text-sm font-medium">Preferred location note</label>
              <Input
                value={pform.preferred_location_note}
                onChange={(e) => setPForm((s) => ({ ...s, preferred_location_note: e.target.value }))}
                placeholder="Optional note"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <Select
                value={pform.status}
                onValueChange={(v) => setPForm((s) => ({ ...s, status: v as typeof PURPOSE_STATUS[number] }))}
              >
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent className="z-[10002]" position="popper" sideOffset={6}>
                  {PURPOSE_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>{PURPOSE_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {purposeErr && <p className="text-sm text-red-500">{purposeErr}</p>}

          <Button
            type="submit"
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            disabled={purposeSaving}
          >
            {purposeSaving ? "Saving..." : "Save Purpose"}
          </Button>
        </form>
      </AnimatedModal>

      {/* Success */}
      <SuccessModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Success"
        message={successMsg}
        autoCloseMs={6000}
      />
    </>
  );
}
