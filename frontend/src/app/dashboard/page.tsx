"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { Users, Briefcase, CheckCircle2, Clock } from "lucide-react";

/* =========================================================
   Brand Palette
========================================================= */
const brand = {
  primary: "#4f46e5",
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  slate: "#64748b",
};

const gradients = [
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)",
];

const donutPalette = ["#6366f1", "#06b6d4", "#3b82f6", "#ef4444", "#f59e0b", "#22c55e"];

/* =========================================================
   Demo Data + Grouping (Monthly / Quarterly / Half-Yearly / Yearly)
========================================================= */
type Period = "monthly" | "quarterly" | "half" | "yearly";

type Kpi = { label: string; value: number; deltaPct: number; up: boolean; icon: any; gradient: string };

type LinePoint = { label: string; open: number; resolved: number };
type DiasporaPoint = { label: string; total: number };
type CategorySlice = { name: string; value: number };
type SourceRow = { source: string; submissions: number; resolvedPct: number; avgDays: number };
type ChatItem = { name: string; message: string; date: string; unread?: number; online?: boolean };

const rawMonthly = [
  { m: "Jan", diasporas: 180, open: 42, resolved: 18 },
  { m: "Feb", diasporas: 210, open: 49, resolved: 24 },
  { m: "Mar", diasporas: 260, open: 63, resolved: 31 },
  { m: "Apr", diasporas: 240, open: 58, resolved: 39 },
  { m: "May", diasporas: 300, open: 75, resolved: 46 },
  { m: "Jun", diasporas: 320, open: 61, resolved: 53 },
  { m: "Jul", diasporas: 280, open: 55, resolved: 47 },
  { m: "Aug", diasporas: 295, open: 60, resolved: 51 },
  { m: "Sep", diasporas: 305, open: 66, resolved: 56 },
  { m: "Oct", diasporas: 285, open: 58, resolved: 50 },
  { m: "Nov", diasporas: 265, open: 52, resolved: 46 },
  { m: "Dec", diasporas: 310, open: 64, resolved: 57 },
];

const catDemo: CategorySlice[] = [
  { name: "Investment", value: 32 },
  { name: "Tourism", value: 26 },
  { name: "Study", value: 15 },
  { name: "Family", value: 12 },
  { name: "Charity/NGO", value: 8 },
  { name: "Other", value: 7 },
];

const sourceDemo: SourceRow[] = [
  { source: "Walk-in", submissions: 210, resolvedPct: 76, avgDays: 4.2 },
  { source: "Phone", submissions: 165, resolvedPct: 81, avgDays: 3.5 },
  { source: "Web", submissions: 320, resolvedPct: 72, avgDays: 3.0 },
];

const chatsDemo: ChatItem[] = [
  { name: "A. Kebede", message: "Thanks for the update…", date: "Jun 12, 2025", online: true },
  { name: "M. Ali", message: "Docs submitted.", date: "Jun 12, 2025", unread: 3 },
  { name: "S. Ahmed", message: "Next steps?", date: "Jun 11, 2025" },
  { name: "B. Noor", message: "Appointment time?", date: "Jun 11, 2025", unread: 2 },
];

function group(period: Period) {
  if (period === "monthly") {
    // Use first 6 months for the chart look like the mock
    const months = rawMonthly.slice(0, 6);
    return {
      over: months.map((r) => ({ label: r.m, open: r.open, resolved: r.resolved } as LinePoint)),
      dias: months.map((r, i) => ({
        label: r.m,
        total: rawMonthly.slice(0, i + 1).reduce((a, c) => a + c.diasporas, 0), // cumulative feel
      })),
    };
  }
  if (period === "quarterly") {
    const Q = [
      { label: "Q1", arr: rawMonthly.slice(0, 3) },
      { label: "Q2", arr: rawMonthly.slice(3, 6) },
      { label: "Q3", arr: rawMonthly.slice(6, 9) },
      { label: "Q4", arr: rawMonthly.slice(9, 12) },
    ];
    const over = Q.map((q) => ({
      label: q.label,
      open: sum(q.arr, "open"),
      resolved: sum(q.arr, "resolved"),
    }));
    const dias = Q.map((q, i) => ({
      label: q.label,
      total: sum(rawMonthly.slice(0, (i + 1) * 3), "diasporas"),
    }));
    return { over, dias };
  }
  if (period === "half") {
    const H = [
      { label: "H1", arr: rawMonthly.slice(0, 6) },
      { label: "H2", arr: rawMonthly.slice(6, 12) },
    ];
    const over = H.map((h) => ({
      label: h.label,
      open: sum(h.arr, "open"),
      resolved: sum(h.arr, "resolved"),
    }));
    const dias = H.map((h, i) => ({
      label: h.label,
      total: sum(rawMonthly.slice(0, (i + 1) * 6), "diasporas"),
    }));
    return { over, dias };
  }
  // yearly
  const over = [
    {
      label: "2025",
      open: sum(rawMonthly, "open"),
      resolved: sum(rawMonthly, "resolved"),
    },
  ];
  const dias = [{ label: "2025", total: sum(rawMonthly, "diasporas") }];
  return { over, dias };
}

/* =========================================================
   Page
========================================================= */
export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("monthly");

  const { over: overview, dias: diasporaTrend } = useMemo(() => group(period), [period]);

  const kpis: Kpi[] = useMemo(
    () => [
      {
        label: "Total Diasporas",
        value: sum(rawMonthly, "diasporas"),
        deltaPct: 0.43,
        up: true,
        icon: Users,
        gradient: gradients[0],
      },
      {
        label: "Total Purposes",
        value: 2200,
        deltaPct: 4.35,
        up: true,
        icon: Briefcase,
        gradient: gradients[1],
      },
      {
        label: "Resolved Cases",
        value: sum(rawMonthly, "resolved"),
        deltaPct: 2.59,
        up: true,
        icon: CheckCircle2,
        gradient: gradients[2],
      },
      {
        label: "Pending Cases",
        value: sum(rawMonthly, "open") - sum(rawMonthly, "resolved"),
        deltaPct: -0.95,
        up: false,
        icon: Clock,
        gradient: gradients[3],
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <Card
            key={k.label}
            className="border-none shadow-sm ring-1 ring-gray-200/60 dark:ring-white/10 overflow-hidden"
            style={{ background: k.gradient }}
          >
            <CardContent className="p-4 text-white/95">
              <div className="flex items-start justify-between">
                <div className="opacity-90 text-sm">{k.label}</div>
                <k.icon className="h-5 w-5 opacity-90" />
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div className="text-2xl font-bold drop-shadow-sm">{formatNum(k.value)}</div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold bg-white/20 backdrop-blur",
                    k.up ? "text-white" : "text-red-100"
                  )}
                >
                  {Math.abs(k.deltaPct).toFixed(2)}% {k.up ? "↑" : "↓"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-end gap-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="half">Half-Yearly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Cases Overview */}
        <Card className="border-none shadow-sm ring-1 ring-gray-200/60 dark:ring-white/10">
          <CardHeader>
            <CardTitle>Cases Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="open" stroke={brand.red} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolved" stroke={brand.green} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-md border p-3 dark:border-white/10">
                <div className="text-sm text-gray-500">Open</div>
                <div className="text-xl font-semibold">{formatNum(sumKey(overview, "open"))}</div>
              </div>
              <div className="rounded-md border p-3 dark:border-white/10">
                <div className="text-sm text-gray-500">Resolved</div>
                <div className="text-xl font-semibold">{formatNum(sumKey(overview, "resolved"))}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases by Category */}
        <Card className="border-none shadow-sm ring-1 ring-gray-200/60 dark:ring-white/10">
          <CardHeader>
            <CardTitle>Cases by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catDemo} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                  {catDemo.map((_, i) => (
                    <Cell key={i} fill={donutPalette[i % donutPalette.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Diasporas Trend */}
      <Card className="border-none shadow-sm ring-1 ring-gray-200/60 dark:ring-white/10">
        <CardHeader>
          <CardTitle>Total Diasporas ({labelFor(period)})</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={diasporaTrend}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke={brand.blue} strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottom Row: Sources + Chats */}
      <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2 border-none shadow-sm ring-1 ring-gray-200/60 dark:ring-white/10">
            <CardHeader>
              <CardTitle>Top Countries (Diaspora to Harar)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-500 dark:border-white/10">
                      <th className="py-2">Country</th>
                      <th className="py-2">Diasporas</th>
                      <th className="py-2">% of Total</th>
                      <th className="py-2">Avg. Stay (Years)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { country: "Saudi Arabia", diasporas: 520, pct: 32, stay: 4.5 },
                      { country: "United States", diasporas: 430, pct: 27, stay: 5.1 },
                      { country: "United Arab Emirates", diasporas: 310, pct: 19, stay: 3.8 },
                      { country: "United Kingdom", diasporas: 185, pct: 11, stay: 4.9 },
                      { country: "Canada", diasporas: 140, pct: 9, stay: 5.3 },
                    ].map((c) => (
                      <tr key={c.country} className="border-b last:border-0 dark:border-white/10">
                        <td className="py-3">{c.country}</td>
                        <td className="py-3">{formatNum(c.diasporas)}</td>
                        <td className="py-3">{c.pct}%</td>
                        <td className="py-3">{c.stay.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        <Card className="border-none shadow-sm ring-1 ring-gray-200/60 dark:ring-white/10">
          <CardHeader>
            <CardTitle>Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {chatsDemo.map((c, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-md border p-3 dark:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        c.online ? "bg-green-500" : "bg-gray-300"
                      )}
                    />
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!!c.unread && (
                      <span className="grid h-5 w-5 place-items-center rounded-full text-xs text-white bg-violet-500">
                        {c.unread}
                      </span>
                    )}
                    <div className="text-xs text-gray-500">{c.date}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ================== Helpers ================== */
function formatNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}
function sum(arr: any[], key: string) {
  return arr.reduce((acc, it) => acc + (Number(it?.[key]) || 0), 0);
}
function sumKey(arr: any[], key: string) {
  return arr.reduce((a, c) => a + (Number(c[key]) || 0), 0);
}
function labelFor(p: Period) {
  if (p === "monthly") return "Monthly";
  if (p === "quarterly") return "Quarterly";
  if (p === "half") return "Half-Yearly";
  return "Yearly";
}
