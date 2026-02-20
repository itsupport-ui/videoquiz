"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, MapPin, Phone, Save, Loader2 } from "lucide-react";

export default function ProfileForm() {
  const { update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/profile", { cache: "no-store" });
      const data = await res.json();
      setName(data.name || "");
      setEmail(data.email || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setLoading(false);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, address, phone }) });
    setSaving(false);
    if (!res.ok) { setMessage("Failed to save"); return; }
    try { await update?.({ name, email }); } catch {}
    setMessage("Saved");
  }

  if (loading) return (
    <div className="grid gap-4">
      <div className="h-10 skeleton rounded-[var(--radius)]" />
      <div className="h-10 skeleton rounded-[var(--radius)]" />
      <div className="h-10 skeleton rounded-[var(--radius)]" />
      <div className="h-10 skeleton rounded-[var(--radius)]" />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {message && (
        <div className={message === "Saved" ? "alert alert-success text-sm" : "alert alert-error text-sm"}>{message}</div>
      )}
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--color-text)]">Name</span>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input className="input pl-10" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--color-text)]">Email</span>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input className="input pl-10" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--color-text)]">Address</span>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input className="input pl-10" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your address" />
        </div>
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--color-text)]">Mobile Number</span>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input className="input pl-10" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" />
        </div>
      </label>
      <button className="btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50" type="submit" disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

