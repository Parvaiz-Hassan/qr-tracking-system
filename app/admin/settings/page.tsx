"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    tagline: "",
    thank_you_message: "",
    produced_by_name: "",
    produced_by_subtitle: "",
    produced_by_address: "",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.company) {
          setForm({
            name: data.company.name || "",
            logo_url: data.company.logo_url || "",
            tagline: data.company.tagline || "",
            thank_you_message: data.company.thank_you_message || "",
            produced_by_name: data.company.produced_by_name || "",
            produced_by_subtitle: data.company.produced_by_subtitle || "",
            produced_by_address: data.company.produced_by_address || "",
          });
        }
        setLoading(false);
      });
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setForm({ ...form, logo_url: data.url });
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-neutral-400 text-sm">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Company Settings</h1>
      <p className="text-neutral-500 text-sm mb-6">
        This appears on the customer-facing verification page after a scan.
      </p>

      <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs text-neutral-500">Company Logo</label>
          <div className="flex items-center gap-3 mt-1">
            {form.logo_url && (
              <img src={form.logo_url} alt="logo" className="h-10 object-contain" />
            )}
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
          </div>
          {uploading && <p className="text-xs text-neutral-400 mt-1">Uploading...</p>}
          <p className="text-xs text-neutral-400 mt-1">
            If a previously-uploaded logo looks darker or off-color on the
            verify page, re-upload it here — uploads are now automatically
            corrected to standard web colors.
          </p>
        </div>

        <div>
          <label className="text-xs text-neutral-500">Company Name</label>
          <input
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Geneva Seeds"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500">Tagline</label>
          <input
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            placeholder="Better Seeds · Brighter Tomorrow"
          />
        </div>

        <div className="border-t border-neutral-100 pt-4">
          <p className="text-sm font-medium text-neutral-900 mb-1">
            Produced By (shown at the bottom of the verify page)
          </p>
          <p className="text-xs text-neutral-400 mb-3">
            Replaces the old &quot;Thank you&quot; message with a proper
            produced/packed/marketed-by block, e.g. matching your product
            label.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-neutral-500">Company Legal Name</label>
              <input
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                value={form.produced_by_name}
                onChange={(e) => setForm({ ...form, produced_by_name: e.target.value })}
                placeholder="JP AGRO INNOVATIONS PVT. LTD."
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Subtitle</label>
              <input
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                value={form.produced_by_subtitle}
                onChange={(e) => setForm({ ...form, produced_by_subtitle: e.target.value })}
                placeholder="Centre of Excellence – Seed Operations"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Address</label>
              <textarea
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                rows={2}
                value={form.produced_by_address}
                onChange={(e) => setForm({ ...form, produced_by_address: e.target.value })}
                placeholder={"4/131-3 RN Colony, Athveli, Medchal,\nSecunderabad, Telangana – 501 401"}
              />
              <p className="text-xs text-neutral-400 mt-1">
                Use a new line to control where the address wraps.
              </p>
            </div>
          </div>
        </div>

        {saved && <p className="text-emerald-600 text-sm">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-emerald-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
