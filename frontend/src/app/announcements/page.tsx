"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { SuccessModal } from "@/components/ui/success-modal";
import { Plus, Settings, RefreshCcw, ToggleLeft, ToggleRight } from "lucide-react";

/* ===================== Types aligned to your model ===================== */
type ApiUser = { id: number | string; first_name?: string; last_name?: string; email?: string; username?: string };

type Announcement = {
  id: number | string;
  title: string;
  content: string;
  is_active: boolean | string | number | null;
  is_for_internal: boolean | string | number | null;
  created_at: string;
  updated_at: string;
  created_by?: ApiUser | number | null;
  updated_by?: ApiUser | number | null;
};

type CreateForm = {
  title: string;
  content: string;
  is_active: boolean;
  is_for_internal: boolean;
};

type EditForm = CreateForm;

/* ===================== Helpers ===================== */
const allowedToManage = new Set(["Officer", "Director", "Administrator"]);

const fetchAllPaginated = async <T,>(url: string, headers: Record<string, string>): Promise<T[]> => {
  let next: string | null = url;
  const all: T[] = [];
  while (next) {
    const res = await fetch(next, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} while loading ${next}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      all.push(...(data as T[]));
      next = null;
    } else if (Array.isArray((data as any)?.results)) {
      all.push(...((data as any).results as T[]));
      next = (data as any).next || null;
    } else {
      all.push(data as T);
      next = null;
    }
  }
  return all;
};

const toBool = (v: any) => v === true || v === "true" || v === 1 || v === "1";

const badge = (cls: string, text: string) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{text}</span>
);

const INTERNAL_BADGE = "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
const PUBLIC_BADGE   = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
const ACTIVE_BADGE   = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
const INACTIVE_BADGE = "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

/* ===================== Page ===================== */
export default function AnnouncementsPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const role  = typeof window !== "undefined" ? localStorage.getItem("role")  : null;

  const canManage = !!role && allowedToManage.has(role);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Data
  const [rows, setRows] = useState<Announcement[]>([]);

  // UX
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<"all" | "public" | "internal">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  // Create
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState<CreateForm>({
    title: "",
    content: "",
    is_active: true,
    is_for_internal: false,
  });

  // Manage (edit/delete)
  const [openManage, setOpenManage] = useState(false);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    content: "",
    is_active: true,
    is_for_internal: false,
  });

  // Delete confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Success
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  /* ---------- Load ---------- */
  const loadAnnouncements = async () => {
    if (!API_URL) return;
    try {
      setLoading(true);
      setError("");

      // Managers (Officer/Director/Admin) should see ALL.
      // Try query flags if your API supports them; fall back gracefully.
      const base = `${API_URL}/announcements/`;
      const url = canManage
        ? `${base}?include_inactive=1&include_internal=1`
        : base;

      let list: Announcement[] = [];
      try {
        list = await fetchAllPaginated<Announcement>(url, headers);
      } catch {
        // fallback without params if server doesn't support them
        list = await fetchAllPaginated<Announcement>(base, headers);
      }

      // Normalize booleans to prevent incorrect badges
      const normalized = list.map(a => ({
        ...a,
        is_active: toBool(a.is_active),
        is_for_internal: toBool(a.is_for_internal),
      })) as Announcement[];

      normalized.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
      setRows(normalized);
    } catch (e: any) {
      setError(e?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Filter ---------- */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r0) => {
      const r = { ...r0, is_active: toBool(r0.is_active), is_for_internal: toBool(r0.is_for_internal) };

      const matchSearch =
        !term ||
        [r.title, r.content].filter(Boolean).some((v) => String(v).toLowerCase().includes(term));

      const matchVis =
        visibility === "all" ||
        (visibility === "internal" && r.is_for_internal === true) ||
        (visibility === "public" && r.is_for_internal === false);

      const matchActive =
        activeFilter === "all" ||
        (activeFilter === "active" && r.is_active === true) ||
        (activeFilter === "inactive" && r.is_active === false);

      return matchSearch && matchVis && matchActive;
    });
  }, [rows, search, visibility, activeFilter]);

  /* ---------- Create ---------- */
  const resetCreate = () =>
    setCreateForm({ title: "", content: "", is_active: true, is_for_internal: false });

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!API_URL) return setCreateError("API URL not set");
    if (!token)   return setCreateError("You are not authenticated.");
    if (!canManage) return setCreateError("You do not have permission.");
    if (!createForm.title.trim())   return setCreateError("Title is required.");
    if (!createForm.content.trim()) return setCreateError("Content is required.");

    const payload = {
      title: createForm.title.trim(),
      content: createForm.content.trim(),
      is_active: !!createForm.is_active,
      is_for_internal: !!createForm.is_for_internal,
    };

    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/announcements/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.text()) || `Create failed: ${res.status}`);
      setOpenCreate(false);
      resetCreate();
      await loadAnnouncements();
      setSuccessMsg("Announcement created successfully.");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } catch (e: any) {
      setCreateError(e?.message || "Failed to create announcement");
    } finally {
      setCreating(false);
    }
  };

  /* ---------- Manage ---------- */
  const openManageModal = (row: Announcement) => {
    const norm = { ...row, is_active: toBool(row.is_active), is_for_internal: toBool(row.is_for_internal) };
    setSelected(norm);
    setEditForm({
      title: norm.title || "",
      content: norm.content || "",
      is_active: !!norm.is_active,
      is_for_internal: !!norm.is_for_internal,
    });
    setEditError("");
    setSaving(false);
    setOpenManage(true);
  };

  const submitSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!API_URL || !selected) return;
    if (!token) return setEditError("You are not authenticated.");
    if (!canManage) return setEditError("You do not have permission.");
    if (!editForm.title.trim())   return setEditError("Title is required.");
    if (!editForm.content.trim()) return setEditError("Content is required.");

    const payload = {
      title: editForm.title.trim(),
      content: editForm.content.trim(),
      is_active: !!editForm.is_active,
      is_for_internal: !!editForm.is_for_internal,
    };

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/announcements/${selected.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.text()) || `Update failed: ${res.status}`);
      setOpenManage(false);
      await loadAnnouncements();
      setSuccessMsg("Announcement updated successfully.");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } catch (e: any) {
      setEditError(e?.message || "Failed to update announcement");
    } finally {
      setSaving(false);
    }
  };

  // Delete flow (only inside Manage, with confirmation)
  const confirmDelete = () => setConfirmDeleteOpen(true);
  const cancelDelete  = () => setConfirmDeleteOpen(false);

  const handleDelete = async () => {
    if (!API_URL || !selected) return;
    if (!token) { setEditError("You are not authenticated."); return; }
    if (!canManage) { setEditError("You do not have permission."); return; }
    try {
      setDeleting(true);
      const res = await fetch(`${API_URL}/announcements/${selected.id}/`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok && res.status !== 204) throw new Error((await res.text()) || `Delete failed: ${res.status}`);
      setConfirmDeleteOpen(false);
      setOpenManage(false);
      await loadAnnouncements();
      setSuccessMsg("Announcement deleted successfully.");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } catch (e: any) {
      setEditError(e?.message || "Failed to delete announcement");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- Quick Toggle Active from table ---------- */
  const toggleActive = async (row: Announcement) => {
    if (!API_URL || !token || !canManage) return;
    try {
      const res = await fetch(`${API_URL}/announcements/${row.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ is_active: !toBool(row.is_active) }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, is_active: !toBool(r.is_active) } : r
        )
      );
    } catch {
      // optional toast
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
      <Breadcrumb pageName="Announcements" />

      <div className={cn("rounded-[14px] bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-gray-dark")}>
        {/* Top bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search title or content…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[280px]"
            />
            <select
              className="rounded border border-gray-300 p-2 text-sm dark:border-dark-3 dark:bg-dark-2"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
            >
              <option value="all">All visibility</option>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
            </select>
            <select
              className="rounded border border-gray-300 p-2 text-sm dark:border-dark-3 dark:bg-dark-2"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <Button variant="ghost" onClick={loadAnnouncements} title="Refresh">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          {canManage && (
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {
                setCreateError("");
                resetCreate();
                setOpenCreate(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Announcement
            </Button>
          )}
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:text-center">
              <TableHead className="!text-left">Title & Content</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              {canManage && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="py-4 text-center text-gray-500 dark:text-gray-300">
                  Loading…
                </TableCell>
              </TableRow>
            )}

            {!loading && !!error && (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="py-4 text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="py-4 text-center text-gray-500 dark:text-gray-300">
                  No announcements found
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && filtered.map((a) => {
              const isActive = toBool(a.is_active);
              const isInternal = toBool(a.is_for_internal);

              const creator =
                typeof a.created_by === "object" && a.created_by
                  ? ((a.created_by.first_name || a.created_by.last_name)
                      ? `${a.created_by.first_name ?? ""} ${a.created_by.last_name ?? ""}`.trim()
                      : a.created_by.email || a.created_by.username || "—")
                  : "—";

              return (
                <TableRow key={String(a.id)} className="text-center text-base font-medium text-dark dark:text-white">
                  <TableCell className="!text-left">
                    <div className="font-semibold text-[#5750f1]">{a.title}</div>
                    {a.content && (
                      <div className="text-sm text-gray-600 dark:text-dark-6 line-clamp-2">
                        {a.content}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isInternal
                      ? badge(INTERNAL_BADGE, "Internal")
                      : badge(PUBLIC_BADGE, "Public")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {isActive
                        ? badge(ACTIVE_BADGE, "Active")
                        : badge(INACTIVE_BADGE, "Inactive")}
                      {canManage && (
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(a)} title="Toggle active">
                          {isActive ? <ToggleRight className="h-4 w-4 text-indigo-600" /> : <ToggleLeft className="h-4 w-4 text-slate-500" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{a.created_at ? String(a.created_at).slice(0, 10) : "—"}</div>
                    <div className="text-xs text-gray-500 dark:text-dark-6">{creator}</div>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mx-auto flex items-center gap-2"
                          onClick={() => openManageModal(a)}
                          title="Manage"
                        >
                          <Settings className="h-4 w-4 text-blue-600" />
                          Manage
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Create Modal */}
      <AnimatedModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Create Announcement"
        maxWidthClassName="max-w-xl"
      >
        {!canManage ? (
          <div className="text-sm text-gray-500">You do not have permission.</div>
        ) : (
          <form className="space-y-4" onSubmit={submitCreate}>
            <Input
              placeholder="Title *"
              value={createForm.title}
              onChange={(e) => setCreateForm((s) => ({ ...s, title: e.target.value }))}
              required
            />
            <textarea
              className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
              rows={6}
              placeholder="Content *"
              value={createForm.content}
              onChange={(e) => setCreateForm((s) => ({ ...s, content: e.target.value }))}
              required
            />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createForm.is_for_internal}
                  onChange={(e) => setCreateForm((s) => ({ ...s, is_for_internal: e.target.checked }))}
                />
                Internal (visible to staff only)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm((s) => ({ ...s, is_active: e.target.checked }))}
                />
                Active
              </label>
            </div>

            {createError && <div className="text-sm text-red-500">{createError}</div>}

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </form>
        )}
      </AnimatedModal>

      {/* Manage Modal (edit + delete) */}
      <AnimatedModal
        open={openManage}
        onClose={() => setOpenManage(false)}
        title={selected ? `Manage: ${selected.title}` : "Manage Announcement"}
        maxWidthClassName="max-w-xl"
      >
        {!canManage ? (
          <div className="text-sm text-gray-500">You do not have permission.</div>
        ) : !selected ? (
          <div className="text-sm text-gray-500">No announcement selected.</div>
        ) : (
          <form className="space-y-4" onSubmit={submitSave}>
            <Input
              placeholder="Title *"
              value={editForm.title}
              onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
              required
            />
            <textarea
              className="w-full rounded border border-gray-300 p-2 dark:border-dark-2"
              rows={6}
              placeholder="Content *"
              value={editForm.content}
              onChange={(e) => setEditForm((s) => ({ ...s, content: e.target.value }))}
              required
            />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.is_for_internal}
                  onChange={(e) => setEditForm((s) => ({ ...s, is_for_internal: e.target.checked }))}
                />
                Internal (staff only)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm((s) => ({ ...s, is_active: e.target.checked }))}
                />
                Active
              </label>
            </div>

            {editError && <div className="text-sm text-red-500">{editError}</div>}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>

                <Button
                  type="button"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={confirmDelete}
                >
                  Delete
                </Button>
              </div>

              <div className="text-xs text-gray-500 dark:text-dark-6">
                Created: {selected?.created_at ? String(selected.created_at).slice(0, 10) : "—"}
              </div>
            </div>
          </form>
        )}
      </AnimatedModal>

      {/* Delete confirmation modal */}
      <AnimatedModal
        open={confirmDeleteOpen}
        onClose={cancelDelete}
        title="Confirm Deletion"
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm">
            Are you sure you want to <span className="font-semibold">delete</span> this announcement?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Yes, Delete"}
            </Button>
          </div>
        </div>
      </AnimatedModal>

      {/* Success modal */}
      <SuccessModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Success"
        message={successMsg}
        autoCloseMs={2500}
      />
    </>
  );
}
