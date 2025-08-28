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
  }>({
    diaspora_id: myDiasporaId || "",
    current_stage: "INTAKE",
    overall_status: "ACTIVE",
    diasporaSearch: "",
    diasporaOptions: [],
  });

  /** Fetch ALL pages of /cases/ (DRF-friendly) */
  const fetchAllCases = async (headers: Record<string,string>): Promise<ApiCase[]> => {
    let all: ApiCase[] = [];
    let nextUrl: string | null = `${API_URL}/cases/`;
    while (nextUrl) {
      const res = await fetch(nextUrl, { headers, cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        all = all.concat(data as ApiCase[]);
        nextUrl = null;
      } else if (Array.isArray(data?.results)) {
        all = all.concat(data.results as ApiCase[]);
        nextUrl = data.next || null;
      } else {
        nextUrl = null;
      }
    }
    return all;
  };

  const nameFromDiaspora = (d?: ApiDiasporaLite) =>
    d ? ([d.first_name, d.last_name].filter(Boolean).join(" ").trim() || d.email || d.diaspora_id || "—") : "—";

  const mapRow = (c: ApiCase): Row => {
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

  const loadCases = async () => {
    if (!API_URL || !token) return;
    try {
      setLoading(true); setError("");
      const headers = { Authorization: `Bearer ${token}` };
      const all = await fetchAllCases(headers);

      // If diaspora user & we know their diaspora_id, filter to it
      const visible = (isDiasporaUser && myDiasporaId)
        ? all.filter((c) => {
            if (typeof c.diaspora === "string") return String(c.diaspora) === String(myDiasporaId);
            const d = c.diaspora as ApiDiasporaLite;
            return d?.id === myDiasporaId || d?.diaspora_id === myDiasporaId;
          })
        : all;

      setRows(visible.map(mapRow));
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCases(); /* eslint-disable react-hooks/exhaustive-deps */ }, []);

  // Filters
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchStage = stageFilter === "all" || r.current_stage === stageFilter;
      const matchStatus = statusFilter === "all" || r.overall_status === statusFilter;
      const matchSearch =
        !term ||
        [r.diaspora_name, r.diaspora_email, r.diaspora_phone, r.diaspora_id]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return matchStage && matchStatus && matchSearch;
    });
  }, [rows, stageFilter, statusFilter, search]);

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
    } catch (e) {
      // ignore silently
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
      <Breadcrumb pageName="Cases" />

      <div className={cn("rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark dark:shadow-card")}>
        {/* Filters & Add */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {/* Stage filter */}
            <Select onValueChange={(v) => setStageFilter(v)} defaultValue="all">
              <SelectTrigger className="w-[200px]">
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
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Search diaspora name / email / phone / id"
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
                        onClick={() => setForm((s) => ({ ...s, diaspora_id: String(d.id) }))}
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
