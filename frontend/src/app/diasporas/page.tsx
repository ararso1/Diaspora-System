"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

/* ========= Types (API) ========= */
type ApiDiaspora = {
  id: string;            // UUID
  diaspora_id: string;
  user?: {
    id: number;
    email: string;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  primary_phone?: string;
  id_number?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  roles: string[];   // always ["Diaspora"] here
  status: string;    // display only
};

const statusBadge: Record<string, string> = {
  active: "bg-green-200 text-green-800",
};

export default function DiasporasPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const currentUserGroups: string[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("user_groups");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((g) => (typeof g === "string" ? g : g?.name)).filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  }, []);
  const isOfficer = currentUserGroups.includes("Officer");

  const mapDiaspora = (d: ApiDiaspora): Row => {
    const name =
      [d.user?.first_name, d.user?.last_name].filter(Boolean).join(" ").trim() ||
      d.user?.email ||
      d.diaspora_id ||
      `Diaspora #${d.id}`;
    return {
      id: d.id,
      name,
      email: d.user?.email || "—",
      phone: d.primary_phone || "—",
      nationalId: d.id_number || "—",
      roles: ["Diaspora"],
      status: "active",
    };
  };

  const loadDiasporas = async () => {
    if (!API_URL) {
      setPageError("ENV NEXT_PUBLIC_API_URL is not set");
      return;
    }
    try {
      setLoading(true);
      setPageError("");
      const res = await fetch(`${API_URL}/diasporas/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load diasporas: ${res.status}`);
      const data: ApiDiaspora[] = await res.json();
      setRows((Array.isArray(data) ? data : []).map(mapDiaspora));
    } catch (err: any) {
      setPageError(err?.message || "Failed to load diasporas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiasporas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusOptions = useMemo(() => ["all", "active"], []);
  const roleOptions = useMemo(() => ["all", "Diaspora", "Officer"], []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch =
        !term ||
        [r.name, r.email, r.phone, r.nationalId].some((v) =>
          String(v || "").toLowerCase().includes(term)
        );
      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "Diaspora" && r.roles.includes("Diaspora")) ||
        (roleFilter === "Officer" && r.roles.includes("Officer"));
      const matchStatus =
        statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [rows, search, roleFilter, statusFilter]);

  return (
    <>
      <Breadcrumb pageName="Diasporas" />

      <div className={cn("rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark dark:shadow-card")}>
        {/* Top bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="w-[200px]">
              <select
                className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r === "all" ? "All Roles" : r}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[180px]">
              <select
                className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All Statuses" : s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <Input
              placeholder="Search name, email, phone, national ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[300px]"
            />
          </div>

          <Button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => router.push("/diasporas/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:text-center">
              <TableHead className="!text-left">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>National ID</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-4 text-center text-gray-500 dark:text-gray-300">
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {!loading && pageError && (
              <TableRow>
                <TableCell colSpan={7} className="py-4 text-center text-red-500">
                  {pageError}
                </TableCell>
              </TableRow>
            )}

            {!loading && !pageError && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-4 text-center text-gray-500 dark:text-gray-300">
                  No diasporas found
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !pageError &&
              filtered.map((u) => (
                <TableRow key={u.id} className="text-center text-base font-medium text-dark dark:text-white">
                  <TableCell className="!text-left">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>{u.nationalId}</TableCell>
                  <TableCell>{u.roles.join(", ")}</TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusBadge[(u.status || "").toLowerCase()] || "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {u.status[0].toUpperCase() + u.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => router.push(`/diasporas/${u.id}/view`)}
                        title="View"
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => router.push(`/diasporas/${u.id}/edit`)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4 text-green-500" />
                        </Button>
                      
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
