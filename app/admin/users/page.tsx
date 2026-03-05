"use client";
import { useEffect, useRef, useState } from "react";
import {
  X, ChevronDown, ChevronRight, CheckCircle, Clock, Loader2,
  RotateCcw, Pencil, Trash2, UserPlus, Users, UserCheck,
  UserX, Shield, Plus,
} from "lucide-react";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  disabledAt?: string | null;
  address?: string;
  phone?: string;
  createdAt?: string;
};

type Module = { id: string; order: number; title: string };
type MainModuleRef = { id: number; orderIndex: number; title: string };

type SubModuleProgress = {
  id: string; title: string; status: string;
  attemptsUsed: number; attemptsLeft: number;
  lastScore: number | null; passScore: number;
};
type MainModuleProgress = {
  id: number; title: string; completed: boolean;
  dashboardAverage: number | null; subModuleCount: number;
  subModulesCompleted: number; subModules: SubModuleProgress[];
};
type UserProgress = {
  mainModulesTotal: number; mainModulesCompleted: number;
  subModulesTotal: number; subModulesCompleted: number;
  mainModules: MainModuleProgress[];
};

// â”€â”€â”€ Small Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RoleBadge({ role }: { role: string }) {
  return role === "ADMIN"
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">Admin</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Employee</span>;
}

function StatusBadge({ disabled }: { disabled: boolean }) {
  return disabled
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">Disabled</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "â€”";
  return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AdminUsers() {
  // â”€â”€ Data â”€â”€
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [mainModules, setMainModules] = useState<MainModuleRef[]>([]);
  const [loading, setLoading] = useState(true);

  // â”€â”€ Toast â”€â”€
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string, ok = true) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, ok });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  // â”€â”€ Filters â”€â”€
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "EMPLOYEE">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");

  // â”€â”€ Add/Invite Modal â”€â”€
  const [addModal, setAddModal] = useState(false);
  const [addTab, setAddTab] = useState<"create" | "invite">("create");
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("EMPLOYEE");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  // â”€â”€ Edit Modal â”€â”€
  const [editModal, setEditModal] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("EMPLOYEE");
  const [editPassword, setEditPassword] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  // â”€â”€ Delete Confirm Modal â”€â”€
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // â”€â”€ Disable Confirm Modal â”€â”€
  const [disableTarget, setDisableTarget] = useState<User | null>(null);
  const [disableBusy, setDisableBusy] = useState(false);

  // â”€â”€ Reset Attempts Modal â”€â”€
  const [resetModal, setResetModal] = useState<User | null>(null);
  const [resetTab, setResetTab] = useState<"sub" | "main" | "all">("sub");
  const [resetModuleId, setResetModuleId] = useState("");
  const [resetMainId, setResetMainId] = useState<number | "">("");
  const [resetBusy, setResetBusy] = useState(false);

  // â”€â”€ Progress Modal â”€â”€
  const [progressModal, setProgressModal] = useState<{
    user: User; data: UserProgress | null; loading: boolean;
  } | null>(null);
  const [expandedMM, setExpandedMM] = useState<Set<number>>(new Set());

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function load() {
    setLoading(true);
    try {
      const [userRes, modRes, mainRes] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/admin/modules", { cache: "no-store" }),
        fetch("/api/admin/main-modules", { cache: "no-store" }),
      ]);
      const ud = await userRes.json();
      const md = await modRes.json();
      const maind = await mainRes.json().catch(() => ({ modules: [] }));
      setUsers(ud.users);
      setModules(md.modules.map((m: any) => ({ id: m.id, order: m.order, title: m.title })));
      setMainModules((maind.modules || []).map((m: any) => ({ id: m.id, orderIndex: m.orderIndex, title: m.title })));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // â”€â”€ Filtered list â”€â”€
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (q && !u.name?.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (statusFilter === "ACTIVE" && u.disabledAt) return false;
    if (statusFilter === "DISABLED" && !u.disabledAt) return false;
    return true;
  });

  // â”€â”€ Stats â”€â”€
  const totalEmployees = users.filter((u) => u.role === "EMPLOYEE").length;
  const active = users.filter((u) => !u.disabledAt && u.role === "EMPLOYEE").length;
  const disabled = users.filter((u) => u.disabledAt).length;
  const admins = users.filter((u) => u.role === "ADMIN").length;

  // â”€â”€ Add User â”€â”€
  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail, name: addName, password: addPassword, role: addRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(data.message || "Failed to add user", false); return; }
      showToast("User created successfully");
      setAddModal(false);
      setAddEmail(""); setAddName(""); setAddPassword(""); setAddRole("EMPLOYEE");
      load();
    } finally { setAddBusy(false); }
  }

  // â”€â”€ Invite â”€â”€
  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setAddBusy(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName }),
      });
      if (!res.ok) { showToast("Invite failed", false); return; }
      showToast("Invite sent");
      setAddModal(false);
      setInviteEmail(""); setInviteName("");
    } finally { setAddBusy(false); }
  }

  // â”€â”€ Open Edit â”€â”€
  function openEdit(u: User) {
    setEditModal(u);
    setEditName(u.name || "");
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditPassword("");
    setEditAddress(u.address || "");
    setEditPhone(u.phone || "");
  }

  // â”€â”€ Save Edit â”€â”€
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editModal) return;
    setEditBusy(true);
    try {
      const body: any = { name: editName, email: editEmail, role: editRole, address: editAddress, phone: editPhone };
      if (editPassword) body.password = editPassword;
      const res = await fetch(`/api/admin/users/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { showToast("Failed to save user", false); return; }
      showToast("User updated");
      setEditModal(null);
      load();
    } finally { setEditBusy(false); }
  }

  // â”€â”€ Delete â”€â”€
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(data.message || "Delete failed", false); return; }
      showToast("User deleted");
      setDeleteTarget(null);
      load();
    } finally { setDeleteBusy(false); }
  }

  // â”€â”€ Toggle Disable â”€â”€
  async function confirmDisable() {
    if (!disableTarget) return;
    setDisableBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${disableTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: true }),
      });
      if (!res.ok) { showToast("Failed to disable user", false); return; }
      showToast(`${disableTarget.name || disableTarget.email} disabled`);
      setDisableTarget(null);
      load();
    } finally { setDisableBusy(false); }
  }

  async function enableUser(u: User) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: false }),
    });
    if (!res.ok) { showToast("Failed to enable user", false); return; }
    showToast(`${u.name || u.email} enabled`);
    load();
  }

  // â”€â”€ Reset Attempts â”€â”€
  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetModal) return;
    setResetBusy(true);
    try {
      let body: any = { userId: resetModal.id };
      if (resetTab === "sub") body.moduleId = resetModuleId;
      else if (resetTab === "main") body.mainModuleId = Number(resetMainId);
      else body.all = true;

      const res = await fetch("/api/admin/users/reset-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(data.message || "Failed to reset attempts", false); return; }
      showToast("Attempts reset successfully");
      setResetModal(null);
    } finally { setResetBusy(false); }
  }

  // â”€â”€ Progress â”€â”€
  async function openProgress(u: User) {
    setExpandedMM(new Set());
    setProgressModal({ user: u, data: null, loading: true });
    try {
      const res = await fetch(`/api/admin/users/${u.id}/progress`, { cache: "no-store" });
      const data = await res.json();
      setProgressModal({ user: u, data, loading: false });
    } catch {
      setProgressModal((p) => p ? { ...p, loading: false } : null);
    }
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <>
    <main className="space-y-5">

      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[color:var(--color-brand)]">Users</h1>
        <button
          onClick={() => { setAddModal(true); setAddTab("create"); }}
          className="flex items-center gap-1.5 rounded-lg bg-[color:var(--color-brand)] text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add / Invite
        </button>
      </div>

      {/* â”€â”€ Stats Strip â”€â”€ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Employees", value: totalEmployees, icon: <Users className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
          { label: "Active",          value: active,         icon: <UserCheck className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50" },
          { label: "Disabled",        value: disabled,       icon: <UserX className="w-5 h-5 text-slate-500" />, bg: "bg-slate-50" },
          { label: "Admins",          value: admins,         icon: <Shield className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50" },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className={`rounded-lg p-2 ${bg}`}>{icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* â”€â”€ Toolbar â”€â”€ */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="flex-1 min-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
          placeholder="Search by name or emailâ€¦"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
        >
          <option value="ALL">All Roles</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </select>
      </div>

      {/* â”€â”€ Table â”€â”€ */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-8">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading usersâ€¦
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell">Joined</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">No users match your filters.</td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name || "â€”"}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><StatusBadge disabled={!!u.disabledAt} /></td>
                  <td className="px-4 py-3 hidden xl:table-cell text-slate-500">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Progress */}
                      <button
                        title="View Progress"
                        onClick={() => openProgress(u)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {/* Reset attempts */}
                      <button
                        title="Reset Attempts"
                        onClick={() => { setResetModal(u); setResetTab("sub"); setResetModuleId(""); setResetMainId(""); }}
                        className="rounded p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      {/* Edit */}
                      <button
                        title="Edit User"
                        onClick={() => openEdit(u)}
                        className="rounded p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {/* Enable / Disable */}
                      {u.disabledAt ? (
                        <button
                          title="Enable User"
                          onClick={() => enableUser(u)}
                          className="rounded px-2.5 py-1 text-xs font-medium border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >Enable</button>
                      ) : (
                        <button
                          title="Disable User"
                          onClick={() => setDisableTarget(u)}
                          className="rounded px-2.5 py-1 text-xs font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                        >Disable</button>
                      )}
                      {/* Delete */}
                      <button
                        title="Delete User"
                        onClick={() => setDeleteTarget(u)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>

    {/* â•â•â•â•â•â•â•â•â•â•â•â• ADD / INVITE MODAL â•â•â•â•â•â•â•â•â•â•â•â• */}
    {addModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setAddModal(false)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <div className="flex gap-1">
              {(["create", "invite"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAddTab(t)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${addTab === t ? "bg-[color:var(--color-brand)] text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {t === "create" ? "Create Account" : "Send Invite"}
                </button>
              ))}
            </div>
            <button onClick={() => setAddModal(false)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5">
            {addTab === "create" ? (
              <form onSubmit={submitAdd} className="space-y-3">
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required type="email" />
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Full Name" value={addName} onChange={(e) => setAddName(e.target.value)} required />
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Temporary Password" type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} required />
                <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={addRole} onChange={(e) => setAddRole(e.target.value)}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button type="submit" disabled={addBusy} className="w-full rounded-lg bg-[color:var(--color-brand)] text-white py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {addBusy && <Loader2 className="w-4 h-4 animate-spin" />} Create Account
                </button>
              </form>
            ) : (
              <form onSubmit={submitInvite} className="space-y-3">
                <p className="text-xs text-slate-500 -mt-1">An invite email with a registration link will be sent to the employee.</p>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required type="email" />
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Name (optional)" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
                <button type="submit" disabled={addBusy} className="w-full rounded-lg bg-[color:var(--color-brand)] text-white py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {addBusy && <Loader2 className="w-4 h-4 animate-spin" />} Send Invite
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )}

    {/* â•â•â•â•â•â•â•â•â•â•â•â• EDIT USER MODAL â•â•â•â•â•â•â•â•â•â•â•â• */}
    {editModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditModal(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <p className="font-semibold text-slate-800">Edit User</p>
            <button onClick={() => setEditModal(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={saveEdit} className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Full Name</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Role</label>
                <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Phone</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Optional" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Address</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Optional" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1 block">New Password <span className="font-normal text-slate-400">(leave blank to keep current)</span></label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={editBusy} className="flex-1 rounded-lg bg-[color:var(--color-brand)] text-white py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {editBusy && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
              </button>
              <button type="button" onClick={() => setEditModal(null)} className="px-4 rounded-lg border border-slate-300 text-slate-600 py-2 text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* â•â•â•â•â•â•â•â•â•â•â•â• DISABLE CONFIRM MODAL â•â•â•â•â•â•â•â•â•â•â•â• */}
    {disableTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDisableTarget(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
          <p className="font-semibold text-slate-800 mb-1">Disable User?</p>
          <p className="text-sm text-slate-500 mb-5">
            <strong>{disableTarget.name || disableTarget.email}</strong> will no longer be able to log in until re-enabled.
          </p>
          <div className="flex gap-2">
            <button onClick={confirmDisable} disabled={disableBusy} className="flex-1 rounded-lg bg-slate-700 text-white py-2 text-sm font-medium hover:bg-slate-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {disableBusy && <Loader2 className="w-4 h-4 animate-spin" />} Disable
            </button>
            <button onClick={() => setDisableTarget(null)} className="flex-1 rounded-lg border border-slate-300 text-slate-600 py-2 text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </div>
    )}

    {/* â•â•â•â•â•â•â•â•â•â•â•â• DELETE CONFIRM MODAL â•â•â•â•â•â•â•â•â•â•â•â• */}
    {deleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteTarget(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
          <p className="font-semibold text-red-700 mb-1">Delete User?</p>
          <p className="text-sm text-slate-500 mb-5">
            This will permanently delete <strong>{deleteTarget.name || deleteTarget.email}</strong> along with their attempts and certificate. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={confirmDelete} disabled={deleteBusy} className="flex-1 rounded-lg bg-red-600 text-white py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2">
              {deleteBusy && <Loader2 className="w-4 h-4 animate-spin" />} Delete
            </button>
            <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-lg border border-slate-300 text-slate-600 py-2 text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </div>
    )}

    {/* â•â•â•â•â•â•â•â•â•â•â•â• RESET ATTEMPTS MODAL â•â•â•â•â•â•â•â•â•â•â•â• */}
    {resetModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setResetModal(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <div>
              <p className="font-semibold text-slate-800">Reset Attempts</p>
              <p className="text-xs text-slate-500">{resetModal.name || resetModal.email}</p>
            </div>
            <button onClick={() => setResetModal(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5">
            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1">
              {(["sub", "main", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setResetTab(t)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${resetTab === t ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {t === "sub" ? "By Sub-module" : t === "main" ? "By Main Module" : "Reset All"}
                </button>
              ))}
            </div>
            <form onSubmit={submitReset} className="space-y-4">
              {resetTab === "sub" && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Sub-module (Quiz)</label>
                  <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={resetModuleId} onChange={(e) => setResetModuleId(e.target.value)} required>
                    <option value="">Select a sub-moduleâ€¦</option>
                    {modules.map((m) => <option key={m.id} value={m.id}>{m.order}. {m.title}</option>)}
                  </select>
                </div>
              )}
              {resetTab === "main" && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Main Module</label>
                  <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={resetMainId} onChange={(e) => setResetMainId(e.target.value === "" ? "" : Number(e.target.value))} required>
                    <option value="">Select a main moduleâ€¦</option>
                    {mainModules.map((m) => <option key={m.id} value={m.id}>{m.orderIndex}. {m.title}</option>)}
                  </select>
                </div>
              )}
              {resetTab === "all" && (
                <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  This will clear <strong>all attempt records</strong> for this user across every quiz.
                </p>
              )}
              <button
                type="submit"
                disabled={resetBusy || (resetTab === "sub" && !resetModuleId) || (resetTab === "main" && resetMainId === "")}
                className="w-full rounded-lg bg-amber-600 text-white py-2 text-sm font-medium hover:bg-amber-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetBusy && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Reset
              </button>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* â•â•â•â•â•â•â•â•â•â•â•â• PROGRESS MODAL â•â•â•â•â•â•â•â•â•â•â•â• */}
    {progressModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setProgressModal(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <div>
              <p className="font-semibold text-slate-900">{progressModal.user.name || progressModal.user.email}</p>
              <p className="text-xs text-slate-500">{progressModal.user.email}</p>
            </div>
            <button onClick={() => setProgressModal(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
          </div>
          <div className="overflow-y-auto p-5 space-y-4">
            {progressModal.loading ? (
              <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading progressâ€¦</div>
            ) : !progressModal.data ? (
              <p className="text-red-600 text-sm">Failed to load progress.</p>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  <strong>Main Modules:</strong> {progressModal.data.mainModulesCompleted} / {progressModal.data.mainModulesTotal}
                  &nbsp;Â·&nbsp;
                  <strong>Sub-Modules:</strong> {progressModal.data.subModulesCompleted} / {progressModal.data.subModulesTotal}
                </p>
                {progressModal.data.mainModules.map((mm) => (
                  <div key={mm.id} className="rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-left transition-opacity hover:opacity-90 ${mm.completed ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}
                      onClick={() => setExpandedMM((s) => { const n = new Set(s); n.has(mm.id) ? n.delete(mm.id) : n.add(mm.id); return n; })}
                    >
                      {expandedMM.has(mm.id) ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                      {mm.completed ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <span className="truncate">{mm.title}</span>
                      <span className="ml-auto shrink-0 text-xs font-normal text-slate-500">
                        {mm.subModulesCompleted}/{mm.subModuleCount} sub-modules
                        {mm.dashboardAverage !== null && ` Â· avg ${mm.dashboardAverage}%`}
                      </span>
                    </button>
                    {expandedMM.has(mm.id) && (
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="text-left px-3 py-1.5 font-medium">Sub-Module</th>
                            <th className="text-left px-3 py-1.5 font-medium">Status</th>
                            <th className="text-center px-3 py-1.5 font-medium">Attempts</th>
                            <th className="text-center px-3 py-1.5 font-medium">Left</th>
                            <th className="text-right px-3 py-1.5 font-medium">Last</th>
                            <th className="text-right px-3 py-1.5 font-medium">Pass</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mm.subModules.map((sm) => (
                            <tr key={sm.id} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-1.5 text-slate-700">{sm.title}</td>
                              <td className="px-3 py-1.5">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                                  sm.status === "PASSED" ? "bg-emerald-100 text-emerald-800" :
                                  sm.status === "FAILED" ? "bg-red-100 text-red-700" :
                                  sm.status === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
                                }`}>{sm.status === "PASSED" ? "Passed" : sm.status === "FAILED" ? "Failed" : sm.status === "PENDING" ? "Pending" : "Locked"}</span>
                              </td>
                              <td className="px-3 py-1.5 text-center text-slate-600">{sm.attemptsUsed}</td>
                              <td className="px-3 py-1.5 text-center">
                                <span className={`font-medium ${sm.attemptsLeft === 0 ? "text-red-600" : sm.attemptsLeft === 1 ? "text-amber-600" : "text-slate-600"}`}>
                                  {sm.attemptsLeft}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 text-right text-slate-600">{sm.lastScore !== null ? `${sm.lastScore}%` : "â€”"}</td>
                              <td className="px-3 py-1.5 text-right text-slate-500">{sm.passScore}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    )}

    {/* â•â•â•â•â•â•â•â•â•â•â•â• TOAST â•â•â•â•â•â•â•â•â•â•â•â• */}
    {toast && (
      <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg transition-all ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
        {toast.msg}
        <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
      </div>
    )}
    </>
  );
}
