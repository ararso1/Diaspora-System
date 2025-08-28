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
import { Eye, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { SuccessModal } from "@/components/ui/success-modal";

/* ========= Case enums ========= */
const STAGES = ["INTAKE","SCREENING","REFERRAL","PROCESSING","COMPLETED","CLOSED"] as const;
const STAGE_LABEL: Record<string,string> = {
  INTAKE:"Intake", SCREENING:"Screening", REFERRAL:"Referral",
  PROCESSING:"Processing", COMPLETED:"Completed", CLOSED:"Closed"
};
const STATUS = ["ACTIVE","PAUSED","DONE","REJECTED"] as const;
const STATUS_LABEL: Record<string,string> = {
  ACTIVE:"Active", PAUSED:"Paused", DONE:"Completed", REJECTED:"Rejected"
};

/* ========= Badges ========= */
const stageBadge: Record<string,string> = {
  INTAKE: "bg-gray-200 text-gray-800",
  SCREENING: "bg-blue-200 text-blue-800",
  REFERRAL: "bg-indigo-200 text-indigo-800",
  PROCESSING: "bg-amber-200 text-amber-900",
  COMPLETED: "bg-green-200 text-green-800",
  CLOSED: "bg-slate-300 text-slate-800",
};
const statusBadge: Record<string,string> = {
  ACTIVE: "bg-blue-200 text-blue-800",
  PAUSED: "bg-yellow-200 text-yellow-800",
  DONE: "bg-green-200 text-green-800",
  REJECTED: "bg-red-200 text-red-800",
};

/* ========= Purpose enums (from your model) ========= */
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

/* ========= API Types ========= */
type ApiDiasporaLite = {
  id: string; diaspora_id?: string;
  first_name?: string; last_name?: string;
  email?: string; primary_phone?: string;
};

type ApiCase = {
  id: string | number;
  diaspora: string | ApiDiasporaLite;
  current_stage: typeof STAGES[number];
  overall_status: typeof STATUS[number];
  created_at?: string; updated_at?: string;
};

type ApiPurpose = {
  id: number | string;
  diaspora: string; // uuid
  type: typeof PURPOSE_TYPES[number];
  description?: string;
  sector?: string | null;
  sub_sector?: string | null;
  investment_type?: string | null;
  estimated_capital?: string | number | null; // Decimal may arrive as string
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
  diaspora_email: string;
  diaspora_phone: string;
  current_stage: typeof STAGES[number];
  overall_status: typeof STATUS[number];
  created: string; // YYYY-MM-DD
  updated: string; // YYYY-MM-DD
  // purpose summary (for display & filter)
  purpose_type?: typeof PURPOSE_TYPES[number];
  purpose_status?: typeof PURPOSE_STATUS[number];
};

/* ========= Page ========= */
export default function CasesPage() {
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
  const [error, setError] = useState("");

  // filters
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [purposeTypeFilter, setPurposeTypeFilter] = useState<string>("all");
  const [purposeStatusFilter, setPurposeStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // create modal
  const [openDialog, setOpenDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // create form (minimal: pick diaspora, stage, status)
  const [form, setForm] = useState<{
    diaspora_id: string;
    current_stage: typeof STAGES[number];
    overall_status: typeof STATUS[number];
    diasporaSearch: string; // local search text
    diasporaOptions: ApiDiasporaLite[];
    diasporaPurposes: ApiPurpose[]; // for preview in modal
  }>({
    diaspora_id: myDiasporaId || "",
    current_stage: "INTAKE",
    overall_status: "ACTIVE",
    diasporaSearch: "",
    diasporaOptions: [],
    diasporaPurposes: [],
  });

  /** Fetch ALL pages helper (DRF-friendly) */
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
        // single object; unlikely for list endpoints
        nextUrl = null;
      }
    }
    return all;
  };

  const nameFromDiaspora = (d?: ApiDiasporaLite) =>
    d ? ([d.first_name, d.last_name].filter(Boolean).join(" ").trim() || d.email || d.diaspora_id || "—") : "—";

  const mapRowBase = (c: ApiCase): Row => {
    const d = typeof c.diaspora === "object" ? (c.diaspora as ApiDiasporaLite) : undefined;
    const diaspora_id = d?.diaspora_id || (typeof c.diaspora === "string" ? c.diaspora : "—");
    return {
      id: c.id,
      diaspora_id: diaspora_id || "—",
      diaspora_name: nameFromDiaspora(d),
      diaspora_email: d?.email || "—",
      diaspora_phone: d?.primary_phone || "—",
      current_stage: (c.current_stage || "INTAKE") as any,
      overall_status: (c.overall_status || "ACTIVE") as any,
      created: c.created_at ? String(c.created_at).slice(0,10) : "—",
      updated: c.updated_at ? String(c.updated_at).slice(0,10) : "—",
    };
  };

  /** Load cases, then stitch primary purpose summary per diaspora */
  const loadCases = async () => {
    if (!API_URL || !token) return;
    try {
      setLoading(true); setError("");
      const headers = { Authorization: `Bearer ${token}` };
      const all = await fetchAllPaginated<ApiCase>(`${API_URL}/cases/`, headers);

      // If diaspora user & we know their diaspora_id, filter to it
      const visible = (isDiasporaUser && myDiasporaId)
        ? all.filter((c) => {
            if (typeof c.diaspora === "string") return String(c.diaspora) === String(myDiasporaId);
            const d = c.diaspora as ApiDiasporaLite;
            return d?.id === myDiasporaId || d?.diaspora_id === myDiasporaId;
          })
        : all;

      const baseRows = visible.map(mapRowBase);

      // Collect unique diaspora ids to pull purposes
      const diasporaIds = Array.from(
        new Set(
          baseRows
            .map((r) => r.diaspora_id)
            .filter(Boolean)
        )
      );

      // Fetch purposes for each diaspora in parallel (bounded)
      const chunk = <T,>(arr: T[], size: number) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

      const purposeMap: Record<string, ApiPurpose[]> = {};
      const batches = chunk(diasporaIds, 10);
      for (const group of batches) {
        const results = await Promise.all(
          group.map(async (did) => {
            const list = await fetchAllPaginated<ApiPurpose>(`${API_URL}/purposes/?diaspora=${encodeURIComponent(did)}`, headers);
            return [did, list] as const;
          })
        );
        results.forEach(([did, list]) => { purposeMap[did] = list; });
      }

      // Decide a “primary” purpose per diaspora for summary/filter:
      // pick the most recent by created_at; fallback any; prefer non-DRAFT if available.
      const pickPrimary = (list: ApiPurpose[] | undefined): ApiPurpose | undefined => {
        if (!list || list.length === 0) return undefined;
        const nonDraft = list.filter(p => p.status !== "DRAFT");
        const pool = nonDraft.length ? nonDraft : list;
        const sorted = pool
          .slice()
          .sort((a,b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
        return sorted[0];
      };

      const withPurpose = baseRows.map((r) => {
        const primary = pickPrimary(purposeMap[r.diaspora_id]);
        return {
          ...r,
          purpose_type: primary?.type,
          purpose_status: primary?.status,
        } as Row;
      });

      setRows(withPurpose);
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCases(); /* eslint-disable react-hooks/exhaustive-deps */ }, []);

  // Filters (add purpose filters)
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchStage = stageFilter === "all" || r.current_stage === stageFilter;
      const matchStatus = statusFilter === "all" || r.overall_status === statusFilter;
      const matchPurposeType = purposeTypeFilter === "all" || r.purpose_type === purposeTypeFilter;
      const matchPurposeStatus = purposeStatusFilter === "all" || r.purpose_status === purposeStatusFilter;
      const matchSearch =
        !term ||
        [r.diaspora_name, r.diaspora_email, r.diaspora_phone, r.diaspora_id,
         PURPOSE_TYPE_LABEL[r.purpose_type || ""] || "", PURPOSE_STATUS_LABEL[r.purpose_status || ""] || ""]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return matchStage && matchStatus && matchPurposeType && matchPurposeStatus && matchSearch;
    });
  }, [rows, stageFilter, statusFilter, purposeTypeFilter, purposeStatusFilter, search]);

  /* ===== Diaspora search (for create modal) ===== */
  const searchDiasporas = async (q: string) => {
    if (!API_URL || !token) return;
    try {
      const url = new URL(`${API_URL}/diasporas/`);
      if (q) url.searchParams.set("search", q);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Diaspora search failed: ${res.status}`);
      const data = await res.json();
      const list: ApiDiasporaLite[] = Array.isArray(data) ? data : data?.results || [];
      setForm((s) => ({ ...s, diasporaOptions: list.slice(0, 10) }));
    } catch {
      // ignore silently
    }
  };

  // When a diaspora is chosen in the modal, preview their purposes
  const loadDiasporaPurposesPreview = async (diasporaId: string) => {
    if (!API_URL || !token || !diasporaId) {
      setForm((s) => ({ ...s, diasporaPurposes: [] }));
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const list = await fetchAllPaginated<ApiPurpose>(`${API_URL}/purposes/?diaspora=${encodeURIComponent(diasporaId)}`, headers);
      setForm((s) => ({ ...s, diasporaPurposes: list }));
    } catch {
      setForm((s) => ({ ...s, diasporaPurposes: [] }));
    }
  };

  useEffect(() => {
    if (!openDialog) return;
    const q = form.diasporaSearch.trim();
    const t = setTimeout(() => searchDiasporas(q), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.diasporaSearch, openDialog]);

  return (
    <>
      <Breadcrumb pageName="Purposes" />

      <div className={cn("rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark dark:shadow-card")}>
        {/* Filters & Add */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {/* Stage filter */}
            <Select onValueChange={(v) => setStageFilter(v)} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select onValueChange={(v) => setStatusFilter(v)} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Purpose Type filter */}
            <Select onValueChange={(v) => setPurposeTypeFilter(v)} defaultValue="all">
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
            <Select onValueChange={(v) => setPurposeStatusFilter(v)} defaultValue="all">
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
              placeholder="Search diaspora / id / purpose…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[280px]"
            />
          </div>

          {/* Officers can add; Diaspora users generally shouldn't */}
          {!isDiasporaUser && (
            <Button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => setOpenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Button>
          )}
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:text-center">
              <TableHead className="!text-left">Diaspora</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Overall Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-gray-500 dark:text-gray-300">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!!error && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-red-500">{error}</TableCell>
              </TableRow>
            )}
            {!loading && !error && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-gray-500 dark:text-gray-300">
                  No cases found
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && filtered.map((r) => (
              <TableRow key={r.id} className="text-center text-base font-medium text-dark dark:text-white">
                <TableCell className="!text-left">
                  <div className="flex flex-col">
                    <span>{r.diaspora_name}</span>
                    <span className="text-xs text-gray-500">
                      {r.diaspora_email !== "—" ? r.diaspora_email : ""}
                      {r.diaspora_email !== "—" && r.diaspora_phone !== "—" ? " · " : ""}
                      {r.diaspora_phone !== "—" ? r.diaspora_phone : ""}
                      {(r.diaspora_email !== "—" || r.diaspora_phone !== "—") ? " · " : ""}
                      ID: {r.diaspora_id}
                      {(r.purpose_type || r.purpose_status) ? " · " : ""}
                      {r.purpose_type ? PURPOSE_TYPE_LABEL[r.purpose_type] : ""}
                      {r.purpose_type && r.purpose_status ? " · " : ""}
                      {r.purpose_status ? PURPOSE_STATUS_LABEL[r.purpose_status] : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stageBadge[r.current_stage] || "bg-gray-200 text-gray-800"}`}>
                    {STAGE_LABEL[r.current_stage]}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge[r.overall_status] || "bg-gray-200 text-gray-800"}`}>
                    {STATUS_LABEL[r.overall_status]}
                  </span>
                </TableCell>
                <TableCell>{r.created}</TableCell>
                <TableCell>{r.updated}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => router.push(`/cases/${r.id}/view`)}>
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Button>
                    {!isDiasporaUser && (
                      <Button size="icon" variant="ghost" onClick={() => router.push(`/cases/${r.id}/edit`)}>
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

      {/* Create Case Modal */}
      <AnimatedModal
        open={openDialog}
        onClose={() => { if (!creating) setOpenDialog(false); }}
        title="Create Case"
        maxWidthClassName="max-w-2xl"
        disableBackdropClose={creating}
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!API_URL) return setError("NEXT_PUBLIC_API_URL is not set");
            if (!token) return setError("You are not authenticated. Please sign in.");
            if (!form.diaspora_id) return setError("Please select a diaspora for this case.");

            try {
              setCreating(true); setError("");

              const payload = {
                diaspora: form.diaspora_id,
                current_stage: form.current_stage,
                overall_status: form.overall_status,
              };

              const res = await fetch(`${API_URL}/cases/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
              });
              if (!res.ok) throw new Error((await res.text()) || `Create failed: ${res.status}`);

              await res.json().catch(() => null);
              setOpenDialog(false);

              // reset form
              setForm((s) => ({
                diaspora_id: myDiasporaId || "",
                current_stage: "INTAKE",
                overall_status: "ACTIVE",
                diasporaSearch: "",
                diasporaOptions: [],
                diasporaPurposes: [],
              }));

              await loadCases();
              setSuccessMsg("Case created successfully.");
              setSuccessOpen(true);
              setTimeout(() => setSuccessOpen(false), 3000);
            } catch (err: any) {
              setError(err?.message || "Failed to create case");
            } finally {
              setCreating(false);
            }
          }}
        >
          {/* Diaspora picker (search → select result) */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Find Diaspora</label>
              <Input
                placeholder="Search name, email, phone, or diaspora ID"
                value={form.diasporaSearch}
                onChange={(e) => setForm((s) => ({ ...s, diasporaSearch: e.target.value }))}
              />
              {form.diasporaOptions.length > 0 && (
                <div className="mt-2 max-h-56 overflow-auto rounded border border-gray-200 dark:border-dark-3">
                  {form.diasporaOptions.map((d) => {
                    const name = [d.first_name, d.last_name].filter(Boolean).join(" ").trim() || d.email || d.diaspora_id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-dark-2",
                          form.diaspora_id === d.id && "bg-blue-50 dark:bg-dark-2"
                        )}
                        onClick={() => {
                          setForm((s) => ({ ...s, diaspora_id: String(d.id) }));
                          // load purposes preview for the selected diaspora
                          loadDiasporaPurposesPreview(String(d.id));
                        }}
                      >
                        <span>{name}</span>
                        <span className="text-xs text-gray-500">ID: {d.diaspora_id || d.id}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Current Stage</label>
              <Select value={form.current_stage} onValueChange={(v) => setForm((s) => ({ ...s, current_stage: v as any }))}>
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Overall Status</label>
              <Select value={form.overall_status} onValueChange={(v) => setForm((s) => ({ ...s, overall_status: v as any }))}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Purposes preview for the selected diaspora (readonly) */}
          {form.diaspora_id && (
            <div className="rounded border p-3 bg-gray-50 dark:bg-dark-2">
              <div className="text-sm font-medium mb-2">Existing Purposes for this Diaspora</div>
              {form.diasporaPurposes.length === 0 ? (
                <div className="text-xs text-gray-500">No purposes found.</div>
              ) : (
                <div className="flex flex-col gap-2 max-h-48 overflow-auto">
                  {form.diasporaPurposes.map((p) => (
                    <div key={String(p.id)} className="text-xs flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{PURPOSE_TYPE_LABEL[p.type] || p.type}</span>
                      <span className={cn("px-2 py-0.5 rounded-full", purposePill[p.status] || "bg-gray-100")}>
                        {PURPOSE_STATUS_LABEL[p.status] || p.status}
                      </span>
                      {p.sector ? <span>· {p.sector}{p.sub_sector ? ` / ${p.sub_sector}` : ""}</span> : null}
                      {p.investment_type ? <span>· {p.investment_type}</span> : null}
                      {p.estimated_capital ? <span>· {p.estimated_capital} {p.currency || ""}</span> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={creating}>
            {creating ? "Saving..." : "Save"}
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
