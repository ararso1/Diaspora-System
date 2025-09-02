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
  roles: string[];
  status: string;
};

const statusBadge: Record<string, string> = {
  active: "bg-green-200 text-green-800",
};

/** DRF-friendly fetch-all helper */
async function fetchAllPaginated<T>(url: string, headers: Record<string, string>) {
  let next: string | null = url;
  const all: T[] = [];
  while (next) {
    const res = await fetch(next, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} on ${next}`);
    const data: any = await res.json();
    if (Array.isArray(data)) {
      all.push(...data); next = null;
    } else if (Array.isArray(data?.results)) {
      all.push(...data.results); next = data.next || null;
    } else {
      all.push(data); next = null;
    }
  }
  return all;
}

/** Read roles robustly from localStorage.role */
function readRolesFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("role");
  if (!raw) return [];
  // Try JSON array first
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((g) => (typeof g === "string" ? g : g?.name))
        .filter(Boolean);
    }
  } catch {
    // fall through if not JSON
  }
  // Handle plain string (or comma-separated)
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Resolve my diaspora UUID (prefer cached, else query by user_id) */
async function resolveMyDiasporaId(
  apiUrl: string,
  headers: Record<string, string>
): Promise<string | null> {
  // 1) cached
  const cached = localStorage.getItem("diaspora_id");
  if (cached) return cached;

  // 2) if we have user_id, try to fetch by user
  const userId = localStorage.getItem("user_id");
  if (!userId) return null;

  // Try `/diasporas/?user=<user_id>`
  const url = new URL(`${apiUrl}/diasporas/`);
  url.searchParams.set("user", String(userId));
  url.searchParams.set("page_size", "1");
  try {
    const res = await fetch(url.toString(), { headers, cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const data: any = await res.json();
    const first =
      Array.isArray(data) ? data[0] : Array.isArray(data?.results) ? data.results[0] : null;
    const id = first?.id || first?.diaspora_id || null;
    if (id) {
      localStorage.setItem("diaspora_id", String(id));
      return String(id);
    }
  } catch {
    // ignore
  }
  return null;
}

export default function DiasporasPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const roles = useMemo(readRolesFromStorage, []);
  const isOfficer = roles.includes("Officer");
  const isDiasporaUser = roles.includes("Diaspora");

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

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (isOfficer) {
        // Officers: all
        const list = await fetchAllPaginated<ApiDiaspora>(`${API_URL}/diasporas/`, headers);
        setRows(list.map(mapDiaspora));
      } else if (isDiasporaUser) {
        // Diaspora: only self
        const myId =
          localStorage.getItem("diaspora_id") ||
          (await resolveMyDiasporaId(API_URL, headers));
        if (!myId) {
          throw new Error(
            "Could not determine your diaspora profile. Please sign out and sign in again."
          );
        }
        const res = await fetch(`${API_URL}/diasporas/${myId}/`, {
          headers,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed to load your profile: ${res.status}`);
        const me: ApiDiaspora = await res.json();
        setRows([mapDiaspora(me)]);
      } else {
        // Unknown role: show nothing
        setRows([]);
        setPageError("You do not have permission to view this page.");
      }
    } catch (err: any) {
      setPageError(err?.message || "Failed to load diasporas");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiasporas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOfficer, isDiasporaUser]);

  const statusOptions = useMemo(() => ["all", "active"], []);
  const roleOptions = useMemo(
    () => (isOfficer ? ["all", "Diaspora", "Officer"] : ["Diaspora"]),
    [isOfficer]
  );

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
            {/* Role filter disabled for diaspora users */}
            <div className="w-[200px]">
              <select
                className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                disabled={!isOfficer}
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

          {isOfficer && (
            <Button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => router.push("/diasporas/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          )}
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
                      {u.status ? u.status[0].toUpperCase() + u.status.slice(1) : "—"}
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
