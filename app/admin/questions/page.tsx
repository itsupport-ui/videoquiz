"use client";
import { useEffect, useRef, useState } from "react";
import QuestionForm, { QuestionType } from "./QuestionForm";
import CsvImportGuide from "./CsvImportGuide";
import { Pencil, Trash2, Eye, EyeOff, X, Loader2, HelpCircle, CheckCircle, AlertCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";

type Module   = { id: string; order: number; title: string };
type Question = { id: string; text: string; options: string[]; correctIndex: number; active: boolean; questionType?: string; correctAnswer?: string };

const PAGE_SIZE = 20;

export default function AdminQuestions() {
  const [modules, setModules]   = useState<Module[]>([]);
  const [moduleId, setModuleId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL"|"MCQ_4"|"MCQ_2"|"TRUE_FALSE">("ALL");
  const [activeFilter, setActiveFilter] = useState<"ALL"|"ACTIVE"|"INACTIVE">("ALL");
  const [page, setPage]         = useState(1);

  const [toast, setToast]       = useState<{msg:string;ok:boolean}|null>(null);
  const toastTimer              = useRef<ReturnType<typeof setTimeout>|null>(null);

  const [editTarget, setEditTarget] = useState<Question|null>(null);
  const [editBusy, setEditBusy]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question|null>(null);
  const [deleteBusy, setDeleteBusy]     = useState(false);

  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvMsg, setCsvMsg]       = useState<string|null>(null);
  const [csvBusy, setCsvBusy]     = useState(false);

  function showToast(msg: string, ok = true) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, ok }); toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  async function loadModules() {
    const data = await fetch("/api/admin/modules", { cache: "no-store" }).then(r => r.json());
    setModules(data.modules || []);
    if (!moduleId && data.modules?.length) setModuleId(data.modules[0].id);
  }
  useEffect(() => { loadModules(); }, []);

  async function loadQuestions() {
    if (!moduleId) return; setLoading(true);
    try {
      const data = await fetch(`/api/admin/questions?moduleId=${encodeURIComponent(moduleId)}`, { cache: "no-store" }).then(r => r.json());
      setQuestions(data.questions || []); setPage(1);
    } finally { setLoading(false); }
  }
  useEffect(() => { loadQuestions(); }, [moduleId]);

  async function addQuestion(data: any) {
    const res = await fetch("/api/admin/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleId, ...data }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(d.message || "Failed to add", false); return; }
    showToast("Question added"); loadQuestions();
  }

  async function toggleActive(q: Question) {
    const res = await fetch(`/api/admin/questions/${q.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !q.active }) });
    if (!res.ok) { showToast("Update failed", false); return; }
    showToast(q.active ? "Deactivated" : "Activated"); loadQuestions();
  }

  async function saveEdit(data: any) {
    if (!editTarget) return; setEditBusy(true);
    try {
      const res = await fetch(`/api/admin/questions/${editTarget.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { showToast("Save failed", false); return; }
      showToast("Question updated"); setEditTarget(null); loadQuestions();
    } finally { setEditBusy(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return; setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/questions/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Delete failed", false); return; }
      showToast("Question deleted"); setDeleteTarget(null); loadQuestions();
    } finally { setDeleteBusy(false); }
  }

  async function handleCsvImport(e: React.FormEvent) {
    e.preventDefault(); setCsvMsg(null); setCsvErrors([]); setCsvBusy(true);
    const input = document.getElementById("csvfile") as HTMLInputElement|null;
    if (!input?.files?.length) { setCsvMsg("Choose a CSV file"); setCsvBusy(false); return; }
    const fd = new FormData(); fd.append("file", input.files[0]);
    try {
      const res = await fetch("/api/admin/questions/import", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setCsvMsg(data.message || "Import failed"); return; }
      setCsvMsg(`Imported ${data.imported}/${data.total}. Failed: ${data.failed}`);
      if (data.errors?.length) setCsvErrors(data.errors);
      loadQuestions();
    } finally { setCsvBusy(false); }
  }

  const filtered = questions.filter(q => {
    if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "ALL" && (q.questionType||"MCQ_4") !== typeFilter) return false;
    if (activeFilter === "ACTIVE" && !q.active) return false;
    if (activeFilter === "INACTIVE" && q.active) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalActive = questions.filter(q=>q.active).length;
  const typeCounts  = questions.reduce((acc,q)=>{ const t=(q.questionType||"MCQ_4"); acc[t]=(acc[t]||0)+1; return acc; }, {} as Record<string,number>);

  return (
    <>
    <main className="space-y-5">
      <h1 className="text-2xl font-semibold text-[color:var(--color-brand)]">Questions</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          [<HelpCircle className="w-5 h-5 text-blue-600"/>, "Total", questions.length, "bg-blue-50"],
          [<CheckCircle className="w-5 h-5 text-emerald-600"/>, "Active", totalActive, "bg-emerald-50"],
          [<HelpCircle className="w-5 h-5 text-purple-600"/>, "MCQ (4)", typeCounts["MCQ_4"]||0, "bg-purple-50"],
          [<AlertCircle className="w-5 h-5 text-amber-600"/>, "T/F & 2-opt", (typeCounts["TRUE_FALSE"]||0)+(typeCounts["MCQ_2"]||0), "bg-amber-50"],
        ].map(([icon, label, value, bg], i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className={`rounded-lg p-2 ${bg as string}`}>{icon as React.ReactNode}</div>
            <div><p className="text-2xl font-bold text-slate-800">{value as number}</p><p className="text-xs text-slate-500">{label as string}</p></div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-3">Bulk Import (CSV)</h3>
        <CsvImportGuide />
        <form onSubmit={handleCsvImport} className="mt-3 grid gap-2 max-w-[640px]">
          <input id="csvfile" type="file" accept=".csv,text/csv" className="text-sm"/>
          <div className="flex items-center gap-2">
            <button disabled={csvBusy} className="rounded-lg bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {csvBusy&&<Loader2 className="w-4 h-4 animate-spin"/>}{csvBusy?"Uploading…":"Upload & Import"}
            </button>
            {csvMsg&&<span className="text-sm text-slate-700">{csvMsg}</span>}
          </div>
          {csvErrors.length>0&&<ul className="mt-2 space-y-1">{csvErrors.map((e,i)=><li key={i} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{e}</li>)}</ul>}
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Add Question</h3>
          <div>
            <label className="text-sm text-slate-600 mr-2">Module:</label>
            <select className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={moduleId} onChange={e=>{ setModuleId(e.target.value); }}>
              {modules.map(m=><option key={m.id} value={m.id}>{m.order}. {m.title}</option>)}
            </select>
          </div>
        </div>
        <QuestionForm onSubmit={addQuestion}/>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Search question text…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        </div>
        <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={typeFilter} onChange={e=>{setTypeFilter(e.target.value as any);setPage(1);}}>
          <option value="ALL">All types</option><option value="MCQ_4">MCQ 4-opt</option><option value="MCQ_2">MCQ 2-opt</option><option value="TRUE_FALSE">True/False</option>
        </select>
        <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={activeFilter} onChange={e=>{setActiveFilter(e.target.value as any);setPage(1);}}>
          <option value="ALL">All status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {loading?<div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 className="w-5 h-5 animate-spin"/>Loading…</div>:(
        <>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Question</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Correct Answer</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr></thead>
            <tbody>
              {pageSlice.length===0&&<tr><td colSpan={5} className="text-center py-10 text-slate-400">No questions match your filters.</td></tr>}
              {pageSlice.map(q=>(
                <tr key={q.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-slate-800 max-w-xs"><span className="line-clamp-2">{q.text}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">{q.questionType||"MCQ_4"}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs">{q.correctAnswer||q.options[q.correctIndex]||""}</td>
                  <td className="px-4 py-3">
                    {q.active?<span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>
                             :<span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">Inactive</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button title={q.active?"Deactivate":"Activate"} onClick={()=>toggleActive(q)} className="rounded p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-700">
                        {q.active?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                      </button>
                      <button title="Edit" onClick={()=>setEditTarget(q)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><Pencil className="w-4 h-4"/></button>
                      <button title="Delete" onClick={()=>setDeleteTarget(q)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages>1&&(
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Showing {(page-1)*PAGE_SIZE+1}{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
              <span>Page {page} / {totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
        </>
      )}
    </main>

    {editTarget&&(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={()=>setEditTarget(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl">
            <p className="font-semibold text-slate-800">Edit Question</p>
            <button onClick={()=>setEditTarget(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-5">
            <QuestionForm
              onSubmit={saveEdit}
              initialText={editTarget.text}
              initialOptions={editTarget.options}
              initialCorrectIndex={editTarget.correctIndex}
              initialQuestionType={(editTarget.questionType as QuestionType)||"MCQ_4"}
              buttonText="Save Changes"
            />
            {editBusy&&<div className="flex items-center gap-2 mt-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin"/>Saving</div>}
          </div>
        </div>
      </div>
    )}

    {deleteTarget&&(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={()=>setDeleteTarget(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
          <p className="font-semibold text-red-700 mb-1">Delete Question?</p>
          <p className="text-sm text-slate-500 mb-5 line-clamp-3">{deleteTarget.text}</p>
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
