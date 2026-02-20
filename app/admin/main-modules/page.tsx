"use client";
import { useEffect, useState } from "react";

type MainModule = {
  id: number;
  title: string;
  description?: string | null;
  youtubeId: string;
  isActive: boolean;
  orderIndex: number;
};

export default function AdminMainModules() {
  const [mods, setMods] = useState<MainModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeId, setYouTubeId] = useState("");
  const [orderIndex, setOrderIndex] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eYouTubeId, setEYouTubeId] = useState("");
  const [eOrderIndex, setEOrderIndex] = useState<number>(1);
  const [eIsActive, setEIsActive] = useState(true);
  const [mainModuleDragIndex, setMainModuleDragIndex] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/main-modules", { cache: "no-store" });
    const data = await res.json();
    setMods(data.modules || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedId != null) loadAssignment(selectedId); }, [selectedId]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setMessage(null);
    const res = await fetch("/api/admin/main-modules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, youtubeId, orderIndex: orderIndex === "" ? undefined : Number(orderIndex), isActive }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMessage(data.message || "Failed to create"); return; }
    setTitle(""); setDescription(""); setYouTubeId(""); setOrderIndex(""); setIsActive(true);
    load();
  }

  async function update(id: number, patch: Partial<MainModule>) {
    const res = await fetch(`/api/admin/main-modules/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (!res.ok) { setMessage("Update failed"); return; }
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this main module? This will not delete sub-modules but will unlink them.")) return;
    const res = await fetch(`/api/admin/main-modules/${id}`, { method: "DELETE" });
    if (!res.ok) { setMessage("Delete failed"); return; }
    load();
  }

  function startEdit(m: MainModule) {
    setEditingId(m.id);
    setETitle(m.title);
    setEDescription(m.description || "");
    setEYouTubeId(m.youtubeId);
    setEOrderIndex(m.orderIndex);
    setEIsActive(m.isActive);
  }
  async function saveEdit() {
    if (editingId == null) return;
    await update(editingId, { title: eTitle, description: eDescription, youtubeId: eYouTubeId, orderIndex: eOrderIndex, isActive: eIsActive });
    setEditingId(null);
  }

  // Main Modules drag & drop reordering
  function onMainModuleDragStart(idx: number) {
    setMainModuleDragIndex(idx);
  }
  function onMainModuleDragOver(e: React.DragEvent<HTMLTableRowElement>) {
    e.preventDefault();
  }
  function onMainModuleDrop(idx: number) {
    if (mainModuleDragIndex == null || mainModuleDragIndex === idx) return;
    const arr = [...mods];
    const [item] = arr.splice(mainModuleDragIndex, 1);
    arr.splice(idx, 0, item);
    // Update all orderIndex values to match new positions
    const updatedMods = arr.map((m, i) => ({ ...m, orderIndex: i + 1 }));
    setMods(updatedMods);
    setMainModuleDragIndex(null);
    // Save the new order to the backend
    saveMainModulesOrder(updatedMods);
  }
  async function saveMainModulesOrder(modules: MainModule[]) {
    const items = modules.map((m) => ({ id: m.id, orderIndex: m.orderIndex }));
    const res = await fetch("/api/admin/main-modules/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    if (!res.ok) {
      alert("Failed to save order");
      load(); // Reload to revert
    }
  }

  // Assignment management
  type SimpleModule = { id: string; title: string; order: number; orderWithinMain?: number | null };
  const [assigned, setAssigned] = useState<SimpleModule[]>([]);
  const [available, setAvailable] = useState<SimpleModule[]>([]);
  async function loadAssignment(id: number) {
    const res = await fetch(`/api/admin/main-modules/${id}/assign`, { cache: "no-store" });
    const data = await res.json();
    setAssigned((data.assigned || []).map((m: any) => ({ id: m.id, title: m.title, order: m.order, orderWithinMain: m.orderWithinMain })));
    setAvailable((data.available || []).map((m: any) => ({ id: m.id, title: m.title, order: m.order })));
  }
  function addModule(mid: string) {
    const m = available.find((x) => x.id === mid);
    if (!m) return;
    setAvailable(available.filter((x) => x.id !== mid));
    setAssigned([...assigned, { ...m, orderWithinMain: assigned.length + 1 }]);
  }
  function removeModule(mid: string) {
    const m = assigned.find((x) => x.id === mid);
    if (!m) return;
    setAssigned(assigned.filter((x) => x.id !== mid).map((x, i) => ({ ...x, orderWithinMain: i + 1 })));
    setAvailable([...available, { id: m.id, title: m.title, order: m.order }]);
  }
  function move(mid: string, dir: -1 | 1) {
    const idx = assigned.findIndex((x) => x.id === mid);
    if (idx < 0) return;
    const ni = idx + dir;
    if (ni < 0 || ni >= assigned.length) return;
    const arr = [...assigned];
    const tmp = arr[idx];
    arr[idx] = arr[ni];
    arr[ni] = tmp;
    setAssigned(arr.map((x, i) => ({ ...x, orderWithinMain: i + 1 })));
  }
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  function onDragStart(idx: number) { setDragIndex(idx); }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) { e.preventDefault(); }
  function onDrop(idx: number) {
    if (dragIndex == null || dragIndex === idx) return;
    const arr = [...assigned];
    const [item] = arr.splice(dragIndex, 1);
    arr.splice(idx, 0, item);
    setAssigned(arr.map((x, i) => ({ ...x, orderWithinMain: i + 1 })));
    setDragIndex(null);
  }
  async function saveAssignment() {
    if (selectedId == null) return;
    const moduleIds = assigned.map((m) => m.id);
    const res = await fetch(`/api/admin/main-modules/${selectedId}/assign`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleIds }) });
    if (!res.ok) {
      alert("Failed to save assignment");
      return;
    }
    await loadAssignment(selectedId);
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4 text-[color:var(--color-brand)]">Main Modules</h1>
      {message && <p className="mb-3 text-sm rounded border border-red-300 bg-red-50 text-red-900 px-3 py-2">{message}</p>}

      <section className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] mb-4">
        <h3 className="font-semibold mb-2">Create Main Module</h3>
        <form onSubmit={create} className="grid gap-3 max-w-[620px]">
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="YouTube ID or URL" value={youtubeId} onChange={(e) => setYouTubeId(e.target.value)} required />
          <div className="flex items-center gap-3">
            <input className="w-40 rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Order (optional)" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value === '' ? '' : Number(e.target.value))} />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
            </label>
          </div>
          <button type="submit" className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95">Create</button>
        </form>
      </section>

      <h3 className="font-semibold mb-2">All Main Modules (drag rows to reorder)</h3>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-[var(--shadow-card)]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Order</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Title</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Description</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">YouTube</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Active</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
              <tbody>
              {mods.map((m, idx) => (
                <tr 
                  key={m.id}
                  className="cursor-move hover:bg-slate-50"
                  draggable
                  onDragStart={() => onMainModuleDragStart(idx)}
                  onDragOver={onMainModuleDragOver}
                  onDrop={() => onMainModuleDrop(idx)}
                >
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === m.id ? (
                      <span className="text-slate-500 text-sm italic">Edit below ↓</span>
                    ) : (
                      m.orderIndex
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === m.id ? (
                      <span className="text-slate-500 text-sm italic">Edit below ↓</span>
                    ) : (
                      m.title
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100 max-w-xs">
                    {editingId === m.id ? (
                      <span className="text-slate-500 text-sm italic">Edit below ↓</span>
                    ) : (
                      <span className="text-sm text-slate-600 line-clamp-2" title={m.description || ""}>{m.description || <span className="text-slate-400 italic">No description</span>}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === m.id ? (
                      <span className="text-slate-500 text-sm italic">Edit below ↓</span>
                    ) : (
                      m.youtubeId
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">{m.isActive ? "Yes" : "No"}</td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === m.id ? (
                      <div className="flex gap-2">
                        <button className="rounded bg-[color:var(--color-brand)] text-white px-3 py-1.5 text-sm hover:opacity-95" onClick={saveEdit}>Save</button>
                        <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => startEdit(m)}>Edit</button>
                        <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => setSelectedId(m.id)}>Assign Sub-modules</button>
                        <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => update(m.id, { isActive: !m.isActive })}>{m.isActive ? "Deactivate" : "Activate"}</button>
                        <button className="rounded bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-500" onClick={() => remove(m.id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              </tbody>
          </table>
        </div>
      )}

      {editingId != null && (
        <section className="rounded border-2 border-blue-300 bg-blue-50 p-4 shadow-[var(--shadow-card)] mt-4">
          <h3 className="font-semibold mb-3 text-blue-900">Editing: {mods.find(m => m.id === editingId)?.title}</h3>
          <div className="grid gap-3 max-w-[720px] bg-white p-4 rounded border border-slate-200">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input value={eTitle} onChange={(e) => setETitle(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={eDescription} onChange={(e) => setEDescription(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" rows={4} placeholder="Enter module description..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">YouTube ID or URL</label>
              <input value={eYouTubeId} onChange={(e) => setEYouTubeId(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Order Index</label>
                <input type="number" value={eOrderIndex} onChange={(e) => setEOrderIndex(Number(e.target.value))} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mt-7">
                  <input type="checkbox" checked={eIsActive} onChange={(e) => setEIsActive(e.target.checked)} className="rounded" /> Active
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="rounded bg-[color:var(--color-brand)] text-white px-4 py-2 text-sm hover:opacity-95 font-medium" onClick={saveEdit}>Save Changes</button>
              <button className="rounded border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setEditingId(null)}>Cancel</button>
            </div>
          </div>
        </section>
      )}

      {selectedId != null && (
        <section className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] mt-4">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold">Assign Sub-modules</h3>
            <button className="ml-auto rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => setSelectedId(null)}>Close</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Available</h4>
              <div className="max-h-64 overflow-auto rounded border border-slate-200">
                {available.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                    <span>{m.order}. {m.title}</span>
                    <button className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50" onClick={() => addModule(m.id)}>Add</button>
                  </div>
                ))}
                {available.length === 0 && <div className="px-2 py-2 text-slate-500 text-sm">No modules available</div>}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Assigned (drag to reorder)</h4>
              <div className="max-h-64 overflow-auto rounded border border-slate-200">
                {assigned.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 px-2 py-1 border-b border-slate-100 cursor-move"
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(idx)}
                  >
                    <span className="text-slate-500 w-6">{m.orderWithinMain}</span>
                    <span className="flex-1">{m.title}</span>
                    <div className="flex gap-1">
                      <button className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50" onClick={() => move(m.id, -1)}>Up</button>
                      <button className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50" onClick={() => move(m.id, 1)}>Down</button>
                      <button className="rounded bg-red-600 text-white px-2 py-1 text-xs hover:bg-red-500" onClick={() => removeModule(m.id)}>Remove</button>
                    </div>
                  </div>
                ))}
                {assigned.length === 0 && <div className="px-2 py-2 text-slate-500 text-sm">No sub-modules assigned</div>}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <button onClick={saveAssignment} className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95">Save Assignment</button>
          </div>
        </section>
      )}
    </main>
  );
}
