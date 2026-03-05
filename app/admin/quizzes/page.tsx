"use client";
import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, X, Loader2, ClipboardList, Target, Clock, Search } from "lucide-react";

type QuizRow = { id: string; moduleId: string; moduleTitle: string; order: number; passScore: number; timeLimitSeconds: number };

const INPUT = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]";

export default function AdminQuizzes() {
  const [rows, setRows]       = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [toast, setToast]     = useState<{msg:string;ok:boolean}|null>(null);
  const toastTimer            = useRef<ReturnType<typeof setTimeout>|null>(null);

  const [editTarget, setEditTarget]     = useState<QuizRow|null>(null);
  const [ePassScore, setEPassScore]     = useState<number>(60);
  const [eTimeLimit, setETimeLimit]     = useState<number>(300);
  const [editBusy, setEditBusy]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuizRow|null>(null);
  const [deleteBusy, setDeleteBusy]     = useState(false);

  function showToast(msg: string, ok = true) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, ok });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await fetch("/api/admin/quizzes", { cache: "no-store" }).then(r => r.json());
      setRows((data.quizzes || []).map((q: any) => ({ ...q, timeLimitSeconds: q.timeLimitSeconds ?? 300 })));
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r => !search || r.moduleTitle.toLowerCase().includes(search.toLowerCase()));
  const avgPass = rows.length ? Math.round(rows.reduce((s, r) => s + r.passScore, 0) / rows.length) : 0;

  function openEdit(r: QuizRow) { setEditTarget(r); setEPassScore(r.passScore); setETimeLimit(r.timeLimitSeconds); }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault(); if (!editTarget) return; setEditBusy(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${editTarget.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passScore: ePassScore, timeLimitSeconds: eTimeLimit }) });
      if (!res.ok) { showToast("Update failed", false); return; }
      showToast("Quiz updated"); setEditTarget(null); load();
    } finally { setEditBusy(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return; setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Delete failed", false); return; }
      showToast("Quiz deleted"); setDeleteTarget(null); load();
    } finally { setDeleteBusy(false); }
  }

  function fmtTime(s: number) { const m = Math.floor(s / 60); return `${m}m ${s % 60}s`; }

  return (
    <>
    <main className="space-y-5">
      <h1 className="text-2xl font-semibold text-[color:var(--color-brand)]">Quizzes</h1>

      <div className="grid grid-cols-3 gap-3">
        {[[<ClipboardList className="w-5 h-5 text-blue-600"/>, "Total Quizzes", rows.length, "bg-blue-50"],
          [<Target className="w-5 h-5 text-emerald-600"/>, "Avg Pass Score", `${avgPass}%`, "bg-emerald-50"],
          [<Clock className="w-5 h-5 text-purple-600"/>, "Default Limit", "5m 0s", "bg-purple-50"]].map(([icon, label, value, bg], i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className={`rounded-lg p-2 ${bg as string}`}>{icon as React.ReactNode}</div>
            <div><p className="text-2xl font-bold text-slate-800">{value as string}</p><p className="text-xs text-slate-500">{label as string}</p></div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Search by module…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      {loading ? <div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 className="w-5 h-5 animate-spin"/>Loading…</div> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Module</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Pass Score</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Time Limit</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={5} className="text-center py-10 text-slate-400">No quizzes match your search.</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-slate-500">{r.order}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.moduleTitle}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">{r.passScore}%</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500">{fmtTime(r.timeLimitSeconds)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button title="Edit" onClick={()=>openEdit(r)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><Pencil className="w-4 h-4"/></button>
                      <button title="Delete" onClick={()=>setDeleteTarget(r)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>

    {editTarget&&(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={()=>setEditTarget(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <p className="font-semibold text-slate-800">Edit Quiz — {editTarget.moduleTitle}</p>
            <button onClick={()=>setEditTarget(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><X className="w-5 h-5"/></button>
          </div>
          <form onSubmit={submitEdit} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Pass Score (1–100)</label>
              <input className={INPUT} type="number" min={1} max={100} value={ePassScore} onChange={e=>setEPassScore(Number(e.target.value))} required/>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Time Limit (seconds)</label>
              <input className={INPUT} type="number" min={30} value={eTimeLimit} onChange={e=>setETimeLimit(Number(e.target.value))} required/>
              <p className="text-xs text-slate-400 mt-1">{fmtTime(eTimeLimit)}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={editBusy} className="flex-1 rounded-lg bg-[color:var(--color-brand)] text-white py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {editBusy&&<Loader2 className="w-4 h-4 animate-spin"/>} Save Changes
              </button>
              <button type="button" onClick={()=>setEditTarget(null)} className="px-4 rounded-lg border border-slate-300 text-slate-600 py-2 text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {deleteTarget&&(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={()=>setDeleteTarget(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
          <p className="font-semibold text-red-700 mb-1">Delete Quiz?</p>
          <p className="text-sm text-slate-500 mb-5">This will permanently delete the quiz for <strong>{deleteTarget.moduleTitle}</strong> including all questions and attempts.</p>
          <div className="flex gap-2">
            <button onClick={confirmDelete} disabled={deleteBusy} className="flex-1 rounded-lg bg-red-600 text-white py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2">
              {deleteBusy&&<Loader2 className="w-4 h-4 animate-spin"/>} Delete
            </button>
            <button onClick={()=>setDeleteTarget(null)} className="flex-1 rounded-lg border border-slate-300 text-slate-600 py-2 text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </div>
    )}

    {toast&&(
      <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${toast.ok?"bg-emerald-600":"bg-red-600"}`}>
        {toast.msg}
        <button onClick={()=>setToast(null)} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4"/></button>
      </div>
    )}
    </>
  );
}
