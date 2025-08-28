"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RefreshCcw, Download, LineChart as LineIcon, Table as TableIcon } from "lucide-react";

/* ===================== Types (match ReportsViewSet) ===================== */
type SummaryResp = {
  from: string; to: string;
  total_diasporas: number;
  active_cases: number;
  referrals_by_status: Array<{ status: string; count: number }>;
  purposes_breakdown: Array<{ type: string; count: number }>;
};
type DiasporasByPeriodResp = {
  group: "monthly" | "quarterly" | "yearly";
  from: string; to: string;
  rows: Array<{ period: string; count: number }>;
};
type ProgressByPurposeResp = {
  from: string; to: string;
  rows: Array<{ type: string; status: string; count: number }>;
};
type CasesByStatusResp = {
  by_stage: Array<{ current_stage: string; count: number }>;
  by_overall_status: Array<{ overall_status: string; count: number }>;
};
type ReferralsByOfficeResp = {
  totals: Array<{ to_office__id: string | number; to_office__name: string; to_office__code: string; total: number }>;
  by_status: Array<{ to_office__id: string | number; to_office__name: string; status: string; count: number }>;
};
type PeriodGroup = "monthly" | "quarterly" | "halfyear" | "yearly";

/* ===================== Small UI helpers ===================== */
const Card = ({ children, className = "" }: any) => (
  <div
    className={[
      "rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur",
      "shadow-[0_10px_30px_-10px_rgba(2,6,23,0.12)]",
      "dark:bg-slate-900/60 dark:border-slate-800",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const SectionCard = ({ title, right, children }: any) => (
  <Card className="p-5">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <div className="flex items-center gap-2">{right}</div>
    </div>
    {children}
  </Card>
);

const KPICard = ({ label, value, accent = "indigo" }: { label: string; value: any; accent?: "indigo"|"violet"|"emerald"|"sky" }) => {
  const accentMap: Record<string, string> = {
    indigo: "from-indigo-500/15 to-indigo-500/0 text-indigo-700 dark:text-indigo-300",
    violet: "from-violet-500/15 to-violet-500/0 text-violet-700 dark:text-violet-300",
    emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-700 dark:text-emerald-300",
    sky: "from-sky-500/15 to-sky-500/0 text-sky-700 dark:text-sky-300",
  };
  return (
    <Card className="p-5 relative overflow-hidden">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentMap[accent]}`} />
      <div className="relative">
        <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</div>
      </div>
    </Card>
  );
};

const Pill = ({ children }: any) => (
  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700">
    {children}
  </span>
);

const Bar = ({ value, max, label }: { value: number; max: number; label?: string }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
          style={{ width: `${pct}%` }}
          aria-label={label}
        />
      </div>
      <span className="min-w-12 text-right text-xs text-slate-500 dark:text-slate-400">{pct}%</span>
    </div>
  );
};

/* ===================== Mini SVG Charts (no libs) ===================== */
/** Simple responsive line chart */
function LineChart({
  data, width = 700, height = 220, strokeWidth = 2,
}: { data: Array<{ x: string; y: number }>; width?: number; height?: number; strokeWidth?: number }) {
  const padding = { top: 10, right: 10, bottom: 24, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxY = Math.max(1, ...data.map((d) => d.y));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerH - (d.y / maxY) * innerH;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#e2e8f0" />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#e2e8f0" />
      {/* path */}
      <polyline
        fill="none"
        stroke="url(#g1)"
        strokeWidth={strokeWidth}
        points={points}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* gradient */}
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* x labels (sparse) */}
      {data.map((d, i) => (
        <text
          key={d.x}
          x={padding.left + i * stepX}
          y={height - 6}
          fontSize="10"
          textAnchor="middle"
          fill="#64748b"
        >
          {d.x}
        </text>
      ))}
      {/* y max label */}
      <text x={8} y={padding.top + 10} fontSize="10" fill="#64748b">{maxY}</text>
      <text x={8} y={height - padding.bottom} fontSize="10" fill="#64748b">0</text>
    </svg>
  );
}

/** Donut chart */
function DonutChart({
  rows, width = 280, height = 220, thickness = 16,
}: { rows: Array<{ label: string; value: number }>; width?: number; height?: number; thickness?: number }) {
  const cx = width / 2, cy = height / 2, r = Math.min(cx, cy) - 10;
  const sum = rows.reduce((a, b) => a + b.value, 0) || 1;
  const palette = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#84cc16"];

  let a0 = -Math.PI / 2; // start at top
  const segments = rows.map((row, i) => {
    const angle = (row.value / sum) * Math.PI * 2;
    const a1 = a0 + angle;
    const large = angle > Math.PI ? 1 : 0;

    const p0 = { x: cx + r * Math.cos(a0), y: cy + r * Math.sin(a0) };
    const p1 = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
    const path = `
      M ${p0.x} ${p0.y}
      A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}
    `;
    a0 = a1;
    return { path, color: palette[i % palette.length], row };
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-[280px]">
        {segments.map((s, i) => (
          <g key={i}>
            <path d={s.path} stroke={s.color} strokeWidth={thickness} fill="none" />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={r - thickness / 2} fill="transparent" />
        {/* center label */}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-slate-700 dark:fill-slate-200" fontSize="14">
          Total {sum}
        </text>
      </svg>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded" style={{ background: palette[i % palette.length] }} />
            <span className="min-w-36">{r.label}</span>
            <span className="font-medium">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bar list */
function HBarChart({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const pct = Math.round((r.value / max) * 100);
        return (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="truncate">{r.label}</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{r.value}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== Utils & Labels ===================== */
const qs = (o: Record<string, any>) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

function toHalfYear(rows: DiasporasByPeriodResp["rows"]) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const d = new Date(r.period);
    const y = d.getUTCFullYear();
    const h = d.getUTCMonth() < 6 ? "H1" : "H2";
    const key = `${y}-${h}`;
    map.set(key, (map.get(key) || 0) + r.count);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([period, count]) => ({ period, count }));
}

const stageLabel: Record<string, string> = {
  INTAKE: "Intake", SCREENING: "Screening", REFERRAL: "Referral",
  PROCESSING: "Processing", COMPLETED: "Completed", CLOSED: "Closed",
};
const overallLabel: Record<string, string> = {
  ACTIVE: "Active", PAUSED: "Paused", DONE: "Completed", REJECTED: "Rejected",
};

/* ===================== Page ===================== */
export default function ReportsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Filters
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [periodGroup, setPeriodGroup] = useState<PeriodGroup>("monthly");
  const [purposeTypeFilter, setPurposeTypeFilter] = useState<string>("all");

  // Data
  const [summary, setSummary] = useState<SummaryResp | null>(null);
  const [diasporaPeriods, setDiasporaPeriods] = useState<Array<{ period: string; count: number }>>([]);
  const [progressMatrix, setProgressMatrix] = useState<ProgressByPurposeResp["rows"]>([]);
  const [casesStatus, setCasesStatus] = useState<CasesByStatusResp | null>(null);
  const [refOffice, setRefOffice] = useState<ReferralsByOfficeResp | null>(null);

  // UX
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showGraph, setShowGraph] = useState(false); // <— NEW: toggle

  // Derived
  const purposesInSummary = useMemo(
    () => summary?.purposes_breakdown?.map((p) => p.type) ?? [],
    [summary]
  );
  const maxDiaspora = useMemo(() => Math.max(0, ...diasporaPeriods.map((r) => r.count)), [diasporaPeriods]);

  const progressByType = useMemo(() => {
    const m = new Map<string, { total: number; rows: Array<{ status: string; count: number }> }>();
    progressMatrix.forEach((r) => {
      const key = r.type || "UNKNOWN";
      if (!m.has(key)) m.set(key, { total: 0, rows: [] });
      const cur = m.get(key)!;
      cur.total += r.count;
      cur.rows.push({ status: r.status, count: r.count });
    });
    return m;
  }, [progressMatrix]);

  // default range = current year
  useEffect(() => {
    if (!from || !to) {
      const now = new Date();
      const y = now.getFullYear();
      setFrom(`${y}-01-01`);
      setTo(`${y}-12-31`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    if (!API_URL) return;
    setLoading(true); setErr("");
    try {
      const query = qs({ from: from || undefined, to: to || undefined });
      const groupParam = periodGroup === "halfyear" ? "quarterly" : periodGroup;

      const [S, D, P, C, R] = await Promise.all([
        fetch(`${API_URL}/reports/summary/${query ? `?${query}` : ""}`, { headers, cache: "no-store" }).then(r => r.json()) as Promise<SummaryResp>,
        fetch(`${API_URL}/reports/diasporas_by_period/?group=${groupParam}${query ? `&${query}` : ""}`, { headers, cache: "no-store" }).then(r => r.json()) as Promise<DiasporasByPeriodResp>,
        fetch(`${API_URL}/reports/progress_by_purpose/${query ? `?${query}` : ""}${purposeTypeFilter !== "all" ? `${query ? "&" : "?"}type=${encodeURIComponent(purposeTypeFilter)}` : ""}`, { headers, cache: "no-store" }).then(r => r.json()) as Promise<ProgressByPurposeResp>,
        fetch(`${API_URL}/reports/cases_by_status/`, { headers, cache: "no-store" }).then(r => r.json()) as Promise<CasesByStatusResp>,
        fetch(`${API_URL}/reports/referrals_by_office/${query ? `?${query}` : ""}`, { headers, cache: "no-store" }).then(r => r.json()) as Promise<ReferralsByOfficeResp>,
      ]);

      setSummary(S || null);
      if (periodGroup === "halfyear") {
        setDiasporaPeriods(toHalfYear(D.rows));
      } else {
        setDiasporaPeriods(D.rows || []);
      }
      setProgressMatrix(P?.rows || []);
      setCasesStatus(C || null);
      setRefOffice(R || null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!from || !to) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, periodGroup, purposeTypeFilter]);

  /* ---------- CSV ---------- */
  const exportCsv = (rows: any[], columns: string[], filename: string) => {
    const csv = [
      columns.join(","),
      ...rows.map((r) =>
        columns.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.setAttribute("download", filename);
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  /* ===================== Render ===================== */
  return (
    <>
      {/* Gradient header with mode toggle */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px]">
        <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Reports & Analytics</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Switch between tables and interactive charts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showGraph ? "outline" : "default"}
                className={showGraph ? "" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
                onClick={() => setShowGraph(false)}
              >
                <TableIcon className="mr-2 h-4 w-4" />
                Table View
              </Button>
              <Button
                variant={showGraph ? "default" : "outline"}
                className={showGraph ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
                onClick={() => setShowGraph(true)}
              >
                <LineIcon className="mr-2 h-4 w-4" />
                Graphical View
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters toolbar */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Group</label>
            <Select value={periodGroup} onValueChange={(v) => setPeriodGroup(v as PeriodGroup)}>
              <SelectTrigger><SelectValue placeholder="Group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="halfyear">Half-Year</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Purpose Type</label>
            <Select value={purposeTypeFilter} onValueChange={(v) => setPurposeTypeFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Purpose" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(purposesInSummary.length ? purposesInSummary : [
                  "INVESTMENT","TOURISM","FAMILY","STUDY","CHARITY_NGO","OTHER"
                ]).map((t) => (
                  <SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-12 mt-2 flex items-center gap-2">
            <Button variant="ghost" onClick={loadAll} title="Refresh" className="hover:bg-slate-100 dark:hover:bg-slate-800">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading / Error */}
      {loading && (
        <Card className="p-6">
          <div className="text-center text-slate-500 dark:text-slate-400">Loading…</div>
        </Card>
      )}
      {!!err && !loading && (
        <Card className="p-6">
          <div className="text-center text-rose-600">{err}</div>
        </Card>
      )}

      {!loading && !err && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
            <KPICard label="Total Diasporas" value={summary?.total_diasporas ?? "—"} accent="indigo" />
            <KPICard label="Active Cases" value={summary?.active_cases ?? "—"} accent="violet" />
            <Card className="p-5">
              <div className="text-sm text-slate-500 dark:text-slate-400">Referrals (All Status)</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {(summary?.referrals_by_status || []).reduce((a, b) => a + b.count, 0)}
              </div>
            </Card>
          </div>

          {/* ======= GRAPHICAL VIEW ======= */}
          {showGraph ? (
            <div className="space-y-6">
              {/* Line chart: Diasporas by Period */}
              <SectionCard
                title={`Diasporas by ${periodGroup === "halfyear" ? "Half-Year" : periodGroup[0].toUpperCase() + periodGroup.slice(1)}`}
                right={
                  <Button
                    variant="outline"
                    onClick={() => exportCsv(diasporaPeriods, ["period","count"], "diasporas_by_period.csv")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                }
              >
                <LineChart
                  data={diasporaPeriods.map((r) => ({ x: r.period, y: r.count }))}
                />
              </SectionCard>

              {/* Donut: Purposes Breakdown */}
              <SectionCard
                title="Purposes Breakdown"
                right={
                  <Button
                    variant="outline"
                    onClick={() => exportCsv(summary?.purposes_breakdown || [], ["type","count"], "purposes_breakdown.csv")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                }
              >
                <DonutChart
                  rows={(summary?.purposes_breakdown || []).map((p) => ({
                    label: p.type.replace("_"," "),
                    value: p.count,
                  }))}
                />
              </SectionCard>

              {/* Horizontal bars: Referrals by Office (totals) */}
              <SectionCard
                title="Referrals by Office"
                right={
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        exportCsv(refOffice?.totals || [], ["to_office__code","to_office__name","total"], "referrals_by_office_totals.csv")
                      }
                    >
                      <Download className="mr-2 h-4 w-4" /> Export Totals
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        exportCsv(refOffice?.by_status || [], ["to_office__name","status","count"], "referrals_by_office_status.csv")
                      }
                    >
                      <Download className="mr-2 h-4 w-4" /> Export By Status
                    </Button>
                  </>
                }
              >
                <HBarChart
                  rows={(refOffice?.totals || []).map((o) => ({
                    label: `${o.to_office__code || ""}${o.to_office__code ? " — " : ""}${o.to_office__name || ""}`,
                    value: o.total,
                  }))}
                />
              </SectionCard>

              {/* Horizontal bars: Cases by Stage + Overall (side-by-side) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SectionCard title="Cases by Stage">
                  <HBarChart
                    rows={(casesStatus?.by_stage || []).map((r) => ({
                      label: stageLabel[r.current_stage] || r.current_stage,
                      value: r.count,
                    }))}
                  />
                </SectionCard>
                <SectionCard title="Cases by Overall Status">
                  <HBarChart
                    rows={(casesStatus?.by_overall_status || []).map((r) => ({
                      label: overallLabel[r.overall_status] || r.overall_status,
                      value: r.count,
                    }))}
                  />
                </SectionCard>
              </div>
            </div>
          ) : (
            /* ======= TABLE VIEW (your original cards/tables) ======= */
            <div className="space-y-6">
              {/* Diasporas by Period (Table) */}
              <SectionCard
                title={`Diasporas by ${periodGroup === "halfyear" ? "Half-Year" : periodGroup[0].toUpperCase() + periodGroup.slice(1)}`}
                right={
                  <Button
                    variant="outline"
                    onClick={() => exportCsv(diasporaPeriods, ["period","count"], "diasporas_by_period.csv")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                }
              >
                <Table>
                  <TableHeader>
                    <TableRow className="[&>th]:text-left">
                      <TableHead>Period</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diasporaPeriods.map((r) => (
                      <TableRow key={r.period}>
                        <TableCell className="font-medium">{r.period}</TableCell>
                        <TableCell>{r.count}</TableCell>
                        <TableCell><Bar value={r.count} max={maxDiaspora} label={r.period} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SectionCard>

              {/* Purposes Breakdown (Table) */}
              <SectionCard
                title="Purposes Breakdown"
                right={
                  <Button
                    variant="outline"
                    onClick={() => exportCsv(summary?.purposes_breakdown || [], ["type","count"], "purposes_breakdown.csv")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                }
              >
                <Table>
                  <TableHeader>
                    <TableRow className="[&>th]:text-left">
                      <TableHead>Purpose</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(summary?.purposes_breakdown || []).map((p) => (
                      <TableRow key={p.type}>
                        <TableCell className="capitalize">{p.type.replace("_"," ")}</TableCell>
                        <TableCell>{p.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SectionCard>

              {/* Cases by Status (Tables) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SectionCard title="Cases by Stage">
                  <Table>
                    <TableHeader>
                      <TableRow className="[&>th]:text-left">
                        <TableHead>Stage</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(casesStatus?.by_stage || []).map((r) => (
                        <TableRow key={r.current_stage}>
                          <TableCell>{stageLabel[r.current_stage] || r.current_stage}</TableCell>
                          <TableCell>{r.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </SectionCard>

                <SectionCard title="Cases by Overall Status">
                  <Table>
                    <TableHeader>
                      <TableRow className="[&>th]:text-left">
                        <TableHead>Status</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(casesStatus?.by_overall_status || []).map((r) => (
                        <TableRow key={r.overall_status}>
                          <TableCell>{overallLabel[r.overall_status] || r.overall_status}</TableCell>
                          <TableCell>{r.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </SectionCard>
              </div>

              {/* Referrals by Office (Table) */}
              <SectionCard
                title="Referrals by Office"
                right={
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        exportCsv(refOffice?.totals || [], ["to_office__code","to_office__name","total"], "referrals_by_office_totals.csv")
                      }
                    >
                      <Download className="mr-2 h-4 w-4" /> Export Totals
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        exportCsv(refOffice?.by_status || [], ["to_office__name","status","count"], "referrals_by_office_status.csv")
                      }
                    >
                      <Download className="mr-2 h-4 w-4" /> Export By Status
                    </Button>
                  </>
                }
              >
                <Table>
                  <TableHeader>
                    <TableRow className="[&>th]:text-left">
                      <TableHead>Office</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(refOffice?.totals || []).map((o) => {
                      const label = `${o.to_office__code || ""}${o.to_office__code ? " — " : ""}${o.to_office__name || ""}`;
                      return (
                        <TableRow key={String(o.to_office__id)}>
                          <TableCell className="font-medium">{label}</TableCell>
                          <TableCell>{o.total}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </SectionCard>
            </div>
          )}
        </>
      )}
    </>
  );
}
