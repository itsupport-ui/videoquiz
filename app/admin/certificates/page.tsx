"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award, Download, Eye, Mail, RefreshCw, Trash2,
  ChevronDown, ChevronRight, Search, Users, CheckCircle,
  Clock, X, Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type CertStatus = "issued" | "eligible" | "ineligible";

type CertRow = {
  userId: string;
  email: string;
  name: string | null;
  status: CertStatus;
  issuedAt: string | null;
  totalScore: number | null;
  url?: string;
};

type Stats = {
  totalUsers: number;
  eligibleUsers: number;
  issuedCount: number;
  pendingCount: number;
};

type SubModuleProgress = {
  id: string;
  title: string;
  status: "PASSED" | "FAILED" | "PENDING" | "LOCKED";
  attemptsUsed: number;
  attemptsLeft: number;
  lastScore: number | null;
  passScore: number;
};

type MainModuleProgress = {
  id: number;
  title: string;
  completed: boolean;
  dashboardAverage: number | null;
  subModuleCount: number;
  subModulesCompleted: number;
  subModules: SubModuleProgress[];
};

type UserProgress = {
  mainModulesTotal: number;
  mainModulesCompleted: number;
  subModulesTotal: number;
  subModulesCompleted: number;
  mainModules: MainModuleProgress[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CertStatus }) {
  const map: Record<CertStatus, { label: string; cls: string }> = {
    issued: { label: "Issued", cls: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
    eligible: { label: "Eligible", cls: "bg-amber-100 text-amber-800 border border-amber-200" },
    ineligible: { label: "In Progress", cls: "bg-slate-100 text-slate-600 border border-slate-200" },
  };
  const { label, cls } = map[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

function SubStatusBadge({ status }: { status: SubModuleProgress["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    PASSED:  { label: "Passed",    cls: "bg-emerald-100 text-emerald-800" },
    FAILED:  { label: "Failed",    cls: "bg-red-100 text-red-700" },
    PENDING: { label: "Pending",   cls: "bg-amber-100 text-amber-800" },
    LOCKED:  { label: "Locked",    cls: "bg-slate-100 text-slate-500" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function Toast({ message, type, onDismiss }: { message: string; type: "success" | "error"; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all
      ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
      {message}
      <button onClick={onDismiss}><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminCertificates() {
  // Data
  const [rows, setRows] = useState<CertRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingRows, setLoadingRows] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Search / filter / sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState("asc");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Expanded progress rows
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [progressCache, setProgressCache] = useState<Record<string, UserProgress | "loading" | "error">>({});

  // Preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Confirm revoke
  const [revokeTarget, setRevokeTarget] = useState<CertRow | null>(null);

  // Per-row loading states
  const [rowLoading, setRowLoading] = useState<Record<string, string | null>>({});  // userId -> action

  // Bulk generate
  const [bulkLoading, setBulkLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
  }

  // ── Load rows ────────────────────────────────────────────────────────────

  const loadRows = useCallback(async (s?: string, sf?: string, so?: string, ord?: string) => {
    setLoadingRows(true);
    const params = new URLSearchParams({
      search: s ?? search,
      status: sf ?? statusFilter,
      sort: so ?? sort,
      order: ord ?? order,
    });
    try {
      const res = await fetch(`/api/admin/certificates?${params}`, { cache: "no-store" });
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch {
      showToast("Failed to load certificate data", "error");
    } finally {
      setLoadingRows(false);
    }
  }, [search, statusFilter, sort, order]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/certificates/stats", { cache: "no-store" });
      const data = await res.json();
      setStats(data);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => { loadRows(); loadStats(); }, []);

  // Debounced search
  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadRows(value), 300);
  }

  function handleFilter(sf: string) {
    setStatusFilter(sf);
    loadRows(undefined, sf);
  }

  function handleSort(so: string) {
    const newOrder = sort === so && order === "asc" ? "desc" : "asc";
    setSort(so);
    setOrder(newOrder);
    loadRows(undefined, undefined, so, newOrder);
  }

  // ── Progress expand ────────────────────────────────────────────────────────

  async function toggleExpand(userId: string) {
    const next = new Set(expanded);
    if (next.has(userId)) {
      next.delete(userId);
      setExpanded(next);
      return;
    }
    next.add(userId);
    setExpanded(next);
    if (progressCache[userId]) return;
    setProgressCache((c) => ({ ...c, [userId]: "loading" }));
    try {
      const res = await fetch(`/api/admin/users/${userId}/progress`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProgressCache((c) => ({ ...c, [userId]: data }));
    } catch {
      setProgressCache((c) => ({ ...c, [userId]: "error" }));
    }
  }

  // ── Row actions ───────────────────────────────────────────────────────────

  async function reissue(row: CertRow) {
    setRowLoading((r) => ({ ...r, [row.userId]: "reissue" }));
    try {
      const res = await fetch("/api/admin/certificates/reissue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.userId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        showToast(j.message || "Reissue failed", "error");
        return;
      }
      showToast(`Certificate reissued for ${row.name || row.email}`);
      loadRows();
      loadStats();
    } finally {
      setRowLoading((r) => ({ ...r, [row.userId]: null }));
    }
  }

  async function sendEmail(row: CertRow) {
    setRowLoading((r) => ({ ...r, [row.userId]: "email" }));
    try {
      const res = await fetch("/api/admin/certificates/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.userId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        showToast(j.message || "Email failed", "error");
        return;
      }
      showToast(`Certificate email sent to ${row.email}`);
    } finally {
      setRowLoading((r) => ({ ...r, [row.userId]: null }));
    }
  }

  async function confirmRevoke(row: CertRow) {
    setRowLoading((r) => ({ ...r, [row.userId]: "revoke" }));
    setRevokeTarget(null);
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.userId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        showToast(j.message || "Revoke failed", "error");
        return;
      }
      showToast(`Certificate revoked for ${row.name || row.email}`);
      loadRows();
      loadStats();
    } finally {
      setRowLoading((r) => ({ ...r, [row.userId]: null }));
    }
  }

  async function bulkGenerate() {
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/certificates/bulk-generate", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      showToast(`Generated ${data.generated ?? 0} certificate(s). ${data.skipped ?? 0} skipped.`);
      loadRows();
      loadStats();
    } catch {
      showToast("Bulk generate failed", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-[color:var(--color-brand)]">Certificates</h1>
        <button
          onClick={bulkGenerate}
          disabled={bulkLoading}
          className="inline-flex items-center gap-2 rounded bg-[color:var(--color-brand)] text-white !text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
          Bulk Generate
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: stats?.totalUsers, icon: <Users className="w-5 h-5" />, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Eligible", value: stats?.eligibleUsers, icon: <CheckCircle className="w-5 h-5" />, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Issued", value: stats?.issuedCount, icon: <Award className="w-5 h-5" />, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Pending Generation", value: stats?.pendingCount, icon: <Clock className="w-5 h-5" />, color: "text-blue-700", bg: "bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-2`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {loadingStats ? <span className="animate-pulse inline-block bg-slate-200 h-7 w-8 rounded" /> : (s.value ?? "—")}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)] focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
        >
          <option value="all">All Status</option>
          <option value="issued">Issued</option>
          <option value="eligible">Eligible</option>
          <option value="ineligible">In Progress</option>
        </select>
        <select
          value={`${sort}:${order}`}
          onChange={(e) => { const [s, o] = e.target.value.split(":"); setSort(s); setOrder(o); loadRows(undefined, undefined, s, o); }}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
        >
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="issuedAt:desc">Newest First</option>
          <option value="issuedAt:asc">Oldest First</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-8 px-3 py-3" />
              <th className="text-left px-3 py-3 font-semibold text-slate-700 cursor-pointer hover:text-slate-900" onClick={() => handleSort("name")}>
                Employee {sort === "name" && (order === "asc" ? "↑" : "↓")}
              </th>
              <th className="text-left px-3 py-3 font-semibold text-slate-700">Status</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-700 cursor-pointer hover:text-slate-900" onClick={() => handleSort("issuedAt")}>
                Issued {sort === "issuedAt" && (order === "asc" ? "↑" : "↓")}
              </th>
              <th className="text-right px-3 py-3 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingRows ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td colSpan={5} className="px-3 py-3">
                    <div className="animate-pulse h-5 bg-slate-100 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">No employees found.</td>
              </tr>
            ) : (
              rows.map((row) => {
                const isExpanded = expanded.has(row.userId);
                const progress = progressCache[row.userId];
                const rl = rowLoading[row.userId];
                return [
                  // Main row
                  <tr key={row.userId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleExpand(row.userId)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Show module progress"
                      >
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{row.name || "—"}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-3 text-slate-500">
                      {row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Preview */}
                        {row.url && (
                          <button
                            onClick={() => setPreviewUrl(row.url!)}
                            title="Preview certificate"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {/* Download */}
                        {row.url && (
                          <a
                            href={row.url}
                            download
                            title="Download certificate"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        {/* Reissue */}
                        {(row.status === "issued" || row.status === "eligible") && (
                          <button
                            onClick={() => reissue(row)}
                            disabled={rl === "reissue"}
                            title="Reissue certificate"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
                          >
                            {rl === "reissue"
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <RefreshCw className="w-4 h-4" />}
                          </button>
                        )}
                        {/* Email */}
                        {row.status === "issued" && (
                          <button
                            onClick={() => sendEmail(row)}
                            disabled={rl === "email"}
                            title="Send certificate by email"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
                          >
                            {rl === "email"
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Mail className="w-4 h-4" />}
                          </button>
                        )}
                        {/* Revoke */}
                        {row.status === "issued" && (
                          <button
                            onClick={() => setRevokeTarget(row)}
                            disabled={rl === "revoke"}
                            title="Revoke certificate"
                            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {rl === "revoke"
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>,

                  // Expanded progress row
                  isExpanded && (
                    <tr key={`${row.userId}-progress`} className="bg-slate-50 border-b border-slate-200">
                      <td />
                      <td colSpan={4} className="px-4 pb-4 pt-2">
                        {progress === "loading" ? (
                          <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading progress…
                          </div>
                        ) : progress === "error" ? (
                          <p className="text-red-600 text-sm">Failed to load progress.</p>
                        ) : progress ? (
                          <div className="space-y-3">
                            {/* Summary line */}
                            <p className="text-xs text-slate-500 font-medium">
                              Main Modules: {progress.mainModulesCompleted} / {progress.mainModulesTotal} completed
                              &nbsp;·&nbsp;
                              Sub-Modules: {progress.subModulesCompleted} / {progress.subModulesTotal} completed
                            </p>
                            {/* Per-main-module breakdown */}
                            {progress.mainModules.map((mm) => (
                              <div key={mm.id} className="rounded-lg border border-slate-200 overflow-hidden">
                                <div className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold ${mm.completed ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                                  {mm.completed
                                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                                  {mm.title}
                                  <span className="ml-auto text-xs font-normal text-slate-500">
                                    {mm.subModulesCompleted}/{mm.subModuleCount} sub-modules
                                    {mm.dashboardAverage !== null && ` · avg ${mm.dashboardAverage}%`}
                                  </span>
                                </div>
                                <table className="w-full border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                      <th className="text-left px-3 py-1.5 font-medium">Sub-Module</th>
                                      <th className="text-left px-3 py-1.5 font-medium">Status</th>
                                      <th className="text-center px-3 py-1.5 font-medium">Attempts</th>
                                      <th className="text-center px-3 py-1.5 font-medium">Retries Left</th>
                                      <th className="text-right px-3 py-1.5 font-medium">Last Score</th>
                                      <th className="text-right px-3 py-1.5 font-medium">Pass Score</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {mm.subModules.map((sm) => (
                                      <tr key={sm.id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-3 py-1.5 text-slate-700">{sm.title}</td>
                                        <td className="px-3 py-1.5"><SubStatusBadge status={sm.status} /></td>
                                        <td className="px-3 py-1.5 text-center text-slate-600">{sm.attemptsUsed}</td>
                                        <td className="px-3 py-1.5 text-center">
                                          <span className={`font-medium ${sm.attemptsLeft === 0 ? "text-red-600" : sm.attemptsLeft === 1 ? "text-amber-600" : "text-slate-600"}`}>
                                            {sm.attemptsLeft}
                                          </span>
                                        </td>
                                        <td className="px-3 py-1.5 text-right text-slate-600">
                                          {sm.lastScore !== null ? `${sm.lastScore}%` : "—"}
                                        </td>
                                        <td className="px-3 py-1.5 text-right text-slate-500">{sm.passScore}%</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ),
                ];
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="font-semibold text-slate-800">Certificate Preview</span>
              <div className="flex items-center gap-2">
                <a href={previewUrl} download className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-slate-300 hover:bg-slate-50">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button onClick={() => setPreviewUrl(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe src={previewUrl} className="flex-1 rounded-b-xl" title="Certificate PDF" />
          </div>
        </div>
      )}

      {/* Revoke Confirm Dialog */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setRevokeTarget(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Revoke Certificate?</h3>
            <p className="text-sm text-slate-600 mb-5">
              This will permanently delete the certificate PDF and record for{" "}
              <strong>{revokeTarget.name || revokeTarget.email}</strong>. The user will need to regenerate it.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRevokeTarget(null)} className="px-4 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => confirmRevoke(revokeTarget)}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </main>
  );
}

