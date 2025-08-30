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

/* ========= Referral enums ========= */
const REF_STATUS = ["SENT","RECEIVED","IN_PROGRESS","COMPLETED","REJECTED"] as const;
const REF_STATUS_LABEL: Record<string,string> = {
  SENT:"Sent", RECEIVED:"Received", IN_PROGRESS:"In Progress", COMPLETED:"Completed", REJECTED:"Rejected",
};
const statusBadge: Record<string,string> = {
  SENT: "bg-gray-200 text-gray-800",
  RECEIVED: "bg-blue-200 text-blue-800",
  IN_PROGRESS: "bg-amber-200 text-amber-900",
  COMPLETED: "bg-green-200 text-green-800",
  REJECTED: "bg-red-200 text-red-800",
};

/* ========= API Types (lightweight) ========= */
type ApiOffice = { id: string | number; code?: string; name?: string };
type ApiDiasporaLite = { id: string; first_name?: string; last_name?: string; email?: string; diaspora_id?: string };
type ApiCaseLite = {
  id: string | number;
  diaspora?: string | ApiDiasporaLite;
};
type ApiReferral = {
  id: string | number;
  case: string | ApiCaseLite;
  from_office: string | ApiOffice;
  to_office: string | ApiOffice;
  reason?: string;
  payload_json?: unknown;
  status: typeof REF_STATUS[number];
  received_at?: string | null;
  completed_at?: string | null;
  sla_due_at?: string | null;
  created_at?: string;
};

/* ========= Row for table ========= */
type Row = {
  id: string | number;
  case_id: string;
  diaspora_label: string; // (optional) if case includes diaspora
  from_office: string; // CODE / Name
  to_office: string;   // CODE / Name
  status: typeof REF_STATUS[number];
  created: string;
  sla_due: string;
  received: string;
  completed: string;
};

const diasporaLabel = (d?: ApiDiasporaLite) =>
  d ? ([d.first_name, d.last_name].filter(Boolean).join(" ").trim() || d.email || d.diaspora_id || "—") : "—";

const officeLabel = (o?: ApiOffice) =>
  o ? (o.code ? `${o.code}${o.name ? ` — ${o.name}` : ""}` : (o.name || "—")) : "—";

/* ========= Page ========= */
export default function ReferralsPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const groupsRaw = typeof window !== "undefined" ? localStorage.getItem("user_groups") : "[]";
  const currentUserGroups: string[] = useMemo(() => {
    try {
      const arr = JSON.parse(groupsRaw || "[]");
      return Array.isArray(arr) ? arr.map((g:any)=> (typeof g==="string"? g : g?.name)).filter(Boolean) : [];
    } catch { return []; }
  }, [groupsRaw]);
  const isDiasporaUser = currentUserGroups.includes("Diaspora");

  // table & filters
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toOfficeFilter, setToOfficeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // creation modal
  const [openDialog, setOpenDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // form state
  const [form, setForm] = useState<{
    case_id: string;
    from_office_id: string;
    to_office_id: string;
    status: typeof REF_STATUS[number];
    reason: string;
    sla_due_at: string; // ISO local (yyyy-mm-ddThh:mm)
    // search helpers
    caseSearch: string;
    caseOptions: ApiCaseLite[];
    fromOfficeSearch: string;
    toOfficeSearch: string;
    fromOfficeOptions: ApiOffice[];
    toOfficeOptions: ApiOffice[];
  }>({
    case_id: "",
    from_office_id: "",
    to_office_id: "",
    status: "SENT",
    reason: "",
    sla_due_at: "",
    caseSearch: "",
    caseOptions: [],
    fromOfficeSearch: "",
    toOfficeSearch: "",
    fromOfficeOptions: [],
    toOfficeOptions: [],
  });

  // to office filter dropdown options (loaded once)
  const [toOfficeOptionsForFilter, setToOfficeOptionsForFilter] = useState<ApiOffice[]>([]);

  /** Pagination-friendly fetch */
  const fetchAll = async <T,>(url: string, headers: Record<string,string>): Promise<T[]> => {
    let all: T[] = [];
    let next: string | null = url;
    while (next) {
      const res = await fetch(next, { headers, cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const data: any = await res.json();
      if (Array.isArray(data)) {
        all = all.concat(data as T[]);
        next = null;
      } else if (Array.isArray(data?.results)) {
        all = all.concat(data.results as T[]);
        next = data.next || null;
      } else {
        next = null;
      }
    }
    return all;
  };

  const mapRow = (r: ApiReferral): Row => {
    const c = (typeof r.case === "object" ? r.case : undefined) as ApiCaseLite | undefined;
    const d = (c && typeof c.diaspora === "object" ? (c.diaspora as ApiDiasporaLite) : undefined);
    const from = (typeof r.from_office === "object" ? r.from_office : undefined) as ApiOffice | undefined;
    const to = (typeof r.to_office === "object" ? r.to_office : undefined) as ApiOffice | undefined;

    return {
      id: r.id,
      case_id: String(typeof r.case === "string" ? r.case : c?.id ?? r.id),
      diaspora_label: d ? diasporaLabel(d) : "—",
      from_office: officeLabel(from),
      to_office: officeLabel(to),
      status: r.status || "SENT",
      created: r.created_at ? String(r.created_at).slice(0,10) : "—",
      sla_due: r.sla_due_at ? String(r.sla_due_at).replace("T", " ").slice(0,16) : "—",
      received: r.received_at ? String(r.received_at).replace("T", " ").slice(0,16) : "—",
      completed: r.completed_at ? String(r.completed_at).replace("T", " ").slice(0,16) : "—",
    };
  };

  const loadReferrals = async () => {
    if (!API_URL || !token) return;
    try {
      setLoading(true); setError("");
      const headers = { Authorization: `Bearer ${token}` };
      const list = await fetchAll<ApiReferral>(`${API_URL}/referrals/`, headers);
      setRows(list.map(mapRow));

      // load offices (for filter dropdown)
      if (toOfficeOptionsForFilter.length === 0) {
        const offices = await fetchAll<ApiOffice>(`${API_URL}/offices/`, headers).catch(()=>[]);
        setToOfficeOptionsForFilter(offices.slice(0, 100));
      }
    } catch (e:any) {
      setError(e?.message || "Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReferrals(); /* eslint-disable react-hooks/exhaustive-deps */ }, []);

  // computed
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchToOffice =
        toOfficeFilter === "all" || r.to_office.toLowerCase().includes(toOfficeFilter.toLowerCase());
      const matchSearch =
        !term ||
        [r.case_id, r.diaspora_label, r.from_office, r.to_office, r.created, r.sla_due, r.received, r.completed]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return matchStatus && matchToOffice && matchSearch;
    });
  }, [rows, statusFilter, toOfficeFilter, search]);

  /* ==== Search helpers for modal (debounced) ==== */
  const debounced = (fn: () => void, ms=350) => {
    let t: any;
    return (..._args: any[]) => {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  };

  const searchCases = async () => {
    if (!API_URL || !token) return;
    try {
      const url = new URL(`${API_URL}/cases/`);
      if (form.caseSearch) url.searchParams.set("search", form.caseSearch);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!res.ok) throw new Error(`Case search failed: ${res.status}`);
      const data = await res.json();
      const list: ApiCaseLite[] = Array.isArray(data) ? data : data?.results || [];
      setForm((s)=>({ ...s, caseOptions: list.slice(0, 10) }));
    } catch {/* ignore */}
  };
  const searchFromOffices = async () => {
    if (!API_URL || !token) return;
    try {
      const url = new URL(`${API_URL}/offices/`);
      if (form.fromOfficeSearch) url.searchParams.set("search", form.fromOfficeSearch);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!res.ok) throw new Error(`Office search failed: ${res.status}`);
      const data = await res.json();
      const list: ApiOffice[] = Array.isArray(data) ? data : data?.results || [];
      setForm((s)=>({ ...s, fromOfficeOptions: list.slice(0, 20) }));
    } catch {/* ignore */}
  };
  const searchToOffices = async () => {
    if (!API_URL || !token) return;
    try {
      const url = new URL(`${API_URL}/offices/`);
      if (form.toOfficeSearch) url.searchParams.set("search", form.toOfficeSearch);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!res.ok) throw new Error(`Office search failed: ${res.status}`);
      const data = await res.json();
      const list: ApiOffice[] = Array.isArray(data) ? data : data?.results || [];
      setForm((s)=>({ ...s, toOfficeOptions: list.slice(0, 20) }));
    } catch {/* ignore */}
  };

  useEffect(() => {
    if (!openDialog) return;
    const d1 = debounced(searchCases, 350); d1();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.caseSearch, openDialog]);

  useEffect(() => {
    if (!openDialog) return;
    const d2 = debounced(searchFromOffices, 350); d2();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fromOfficeSearch, openDialog]);

  useEffect(() => {
    if (!openDialog) return;
    const d3 = debounced(searchToOffices, 350); d3();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.toOfficeSearch, openDialog]);

  return (
    <>
      <Breadcrumb pageName="Referrals" />

      <div className={cn("rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark dark:shadow-card")}>
        {/* Filters & Add */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {/* Status filter */}
            <Select onValueChange={(v) => setStatusFilter(v)} defaultValue="all">
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {REF_STATUS.map((s)=>(
                  <SelectItem key={s} value={s}>{REF_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* To Office filter (by text match) */}
            <Select onValueChange={(v)=> setToOfficeFilter(v)} defaultValue="all">
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="To Office" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Offices</SelectItem>
                {toOfficeOptionsForFilter.map((o) => {
                  const label = officeLabel(o);
                  return <SelectItem key={String(o.id)} value={label}>{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>

            <Input
              placeholder="Search case / office / reason"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[280px]"
            />
          </div>

          {!isDiasporaUser && (
            <Button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={()=> setOpenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Button>
          )}
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:text-center">
              <TableHead className="!text-left">Case</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>SLA Due</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={9} className="py-4 text-center text-gray-500 dark:text-gray-300">Loading...</TableCell>
              </TableRow>
            )}
            {!!error && !loading && (
              <TableRow>
                <TableCell colSpan={9} className="py-4 text-center text-red-500">{error}</TableCell>
              </TableRow>
            )}
            {!loading && !error && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-4 text-center text-gray-500 dark:text-gray-300">No referrals found</TableCell>
              </TableRow>
            )}
            {!loading && !error && filtered.map((r)=>(
              <TableRow key={r.id} className="text-center text-base font-medium text-dark dark:text-white">
                <TableCell className="!text-left">
                  <div className="flex flex-col">
                    <span>Case #{r.case_id}</span>
                    {r.diaspora_label !== "—" && (
                      <span className="text-xs text-gray-500">Diaspora: {r.diaspora_label}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{r.from_office}</TableCell>
                <TableCell>{r.to_office}</TableCell>
                <TableCell>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge[r.status] || "bg-gray-200 text-gray-800"}`}>
                    {REF_STATUS_LABEL[r.status]}
                  </span>
                </TableCell>
                <TableCell>{r.created}</TableCell>
                <TableCell>{r.sla_due}</TableCell>
                <TableCell>{r.received}</TableCell>
                <TableCell>{r.completed}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button size="icon" variant="ghost" onClick={()=> router.push(`/referrals/${r.id}/view`)}>
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Button>
                    {!isDiasporaUser && (
                      <Button size="icon" variant="ghost" onClick={()=> router.push(`/referrals/${r.id}/edit`)}>
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

      {/* Create Referral Modal */}
      <AnimatedModal
        open={openDialog}
        onClose={() => { if (!creating) setOpenDialog(false); }}
        title="Create Referral"
        maxWidthClassName="max-w-2xl"
        disableBackdropClose={creating}
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!API_URL) return setError("NEXT_PUBLIC_API_URL is not set");
            if (!token) return setError("You are not authenticated. Please sign in.");
            if (!form.case_id) return setError("Please select a case.");
            if (!form.from_office_id) return setError("Please select the sending (from) office.");
            if (!form.to_office_id) return setError("Please select the receiving (to) office.");

            try {
              setCreating(true); setError("");
              const payload: any = {
                case: form.case_id,
                from_office: form.from_office_id,
                to_office: form.to_office_id,
                reason: form.reason || "",
                status: form.status || "SENT",
                sla_due_at: form.sla_due_at || undefined,
                // payload_json: {} // if you want to attach structured data
              };

              const res = await fetch(`${API_URL}/referrals/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
              });
              if (!res.ok) throw new Error((await res.text()) || `Create failed: ${res.status}`);

              await res.json().catch(()=>null);
              setOpenDialog(false);

              // reset
              setForm({
                case_id: "",
                from_office_id: "",
                to_office_id: "",
                status: "SENT",
                reason: "",
                sla_due_at: "",
                caseSearch: "",
                caseOptions: [],
                fromOfficeSearch: "",
                toOfficeSearch: "",
                fromOfficeOptions: [],
                toOfficeOptions: [],
              });

              await loadReferrals();
              setSuccessMsg("Referral created successfully.");
              setSuccessOpen(true);
              setTimeout(()=> setSuccessOpen(false), 3000);
            } catch (err:any) {
              setError(err?.message || "Failed to create referral");
            } finally {
              setCreating(false);
            }
          }}
        >
          {/* Case picker */}
          <div>
            <label className="mb-1 block text-sm font-medium">Find Case</label>
            <Input
              placeholder="Search case (id, diaspora)"
              value={form.caseSearch}
              onChange={(e)=> setForm((s)=> ({ ...s, caseSearch: e.target.value }))}
            />
            {form.caseOptions.length > 0 && (
              <div className="mt-2 max-h-56 overflow-auto rounded border border-gray-200 dark:border-dark-3">
                {form.caseOptions.map((c)=> {
                  // Show "Case #id" and (optional) diaspora name if present
                  const d = (typeof c.diaspora === "object" ? c.diaspora as ApiDiasporaLite : undefined);
                  const label = `Case #${c.id}${d ? ` — ${diasporaLabel(d)}` : ""}`;
                  return (
                    <button
                      key={String(c.id)}
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-dark-2",
                        form.case_id === String(c.id) && "bg-blue-50 dark:bg-dark-2"
                      )}
                      onClick={()=> setForm((s)=> ({ ...s, case_id: String(c.id) }))}
                    >
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* From / To offices */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">From Office</label>
              <Input
                placeholder="Search office code/name"
                value={form.fromOfficeSearch}
                onChange={(e)=> setForm((s)=> ({ ...s, fromOfficeSearch: e.target.value }))}
              />
              {form.fromOfficeOptions.length > 0 && (
                <div className="mt-2 max-h-56 overflow-auto rounded border border-gray-200 dark:border-dark-3">
                  {form.fromOfficeOptions.map((o)=> {
                    const label = officeLabel(o);
                    return (
                      <button
                        key={String(o.id)}
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-dark-2",
                          form.from_office_id === String(o.id) && "bg-blue-50 dark:bg-dark-2"
                        )}
                        onClick={()=> setForm((s)=> ({ ...s, from_office_id: String(o.id) }))}
                      >
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">To Office</label>
              <Input
                placeholder="Search office code/name"
                value={form.toOfficeSearch}
                onChange={(e)=> setForm((s)=> ({ ...s, toOfficeSearch: e.target.value }))}
              />
              {form.toOfficeOptions.length > 0 && (
                <div className="mt-2 max-h-56 overflow-auto rounded border border-gray-200 dark:border-dark-3">
                  {form.toOfficeOptions.map((o)=> {
                    const label = officeLabel(o);
                    return (
                      <button
                        key={String(o.id)}
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-dark-2",
                          form.to_office_id === String(o.id) && "bg-blue-50 dark:bg-dark-2"
                        )}
                        onClick={()=> setForm((s)=> ({ ...s, to_office_id: String(o.id) }))}
                      >
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Status + SLA due */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(v)=> setForm((s)=> ({ ...s, status: v as typeof REF_STATUS[number] }))}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {REF_STATUS.map((s)=> <SelectItem key={s} value={s}>{REF_STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">SLA Due</label>
              <input
                type="datetime-local"
                className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
                value={form.sla_due_at}
                onChange={(e)=> setForm((s)=> ({ ...s, sla_due_at: e.target.value }))}
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1 block text-sm font-medium">Reason (optional)</label>
            <textarea
              rows={3}
              className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
              placeholder="Provide context for the referral"
              value={form.reason}
              onChange={(e)=> setForm((s)=> ({ ...s, reason: e.target.value }))}
            />
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
