"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_OPTIONS, CategoryKey } from "@/lib/categories";

type QualityAttr = { label: string; value: string };

export default function EditBatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [qualityAttrs, setQualityAttrs] = useState<QualityAttr[]>([]);

  const [form, setForm] = useState({
    name: "",
    variety: "",
    category: "seed" as CategoryKey,
    sub_category: "",
    uses: "",
    instructions: "",
    batch_number: "",
    label_number: "",
    manufacturing_date: "",
    expiry_date: "",
    date_of_testing: "",
    net_weight: "",
    mrp: "",
    usp: "",
  });

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const b = data.batch;
        if (!b) return;
        const product = Array.isArray(b.products) ? b.products[0] : b.products;
        setForm({
          name: product?.name || "",
          variety: product?.variety || "",
          category: product?.category || "seed",
          sub_category: product?.sub_category || "",
          uses: product?.uses || "",
          instructions: product?.instructions || "",
          batch_number: b.batch_number || "",
          label_number: b.label_number || "",
          manufacturing_date: b.manufacturing_date || "",
          expiry_date: b.expiry_date || "",
          date_of_testing: b.date_of_testing || "",
          net_weight: b.net_weight || "",
          mrp: b.mrp || "",
          usp: b.usp || "",
        });
        setQualityAttrs(
          (b.batch_attributes || [])
            .sort((a: any, bb: any) => a.sort_order - bb.sort_order)
            .map((a: any) => ({ label: a.label, value: a.value }))
        );
        setLoading(false);
      });
  }, [id]);

  function updateAttr(i: number, field: "label" | "value", val: string) {
    const next = [...qualityAttrs];
    next[i][field] = val;
    setQualityAttrs(next);
  }

  function addAttrRow() {
    setQualityAttrs([...qualityAttrs, { label: "", value: "" }]);
  }

  function removeAttrRow(i: number) {
    setQualityAttrs(qualityAttrs.filter((_, idx) => idx !== i));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quality_attributes: qualityAttrs.filter((a) => a.label && a.value),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save.");
      return;
    }

    router.push("/admin/products");
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-neutral-400 text-sm">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Edit Batch</h1>

      <form
        onSubmit={handleSave}
        className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Crop / Product Name *</label>
            <input
              required
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Variety</label>
            <input
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.variety}
              onChange={(e) => setForm({ ...form, variety: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Category</label>
            <select
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as CategoryKey,
                  sub_category: "",
                })
              }
            >
              {Object.entries(CATEGORY_OPTIONS).map(([key, opt]) => (
                <option key={key} value={key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500">Sub-category</label>
            <select
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.sub_category}
              onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
            >
              <option value="">— Select —</option>
              {CATEGORY_OPTIONS[form.category]?.subCategories.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Lot / Batch No. *</label>
            <input
              required
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.batch_number}
              onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Label No.</label>
            <input
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.label_number}
              onChange={(e) => setForm({ ...form, label_number: e.target.value })}
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-neutral-500 mb-2">Seed Quality & Test Details</p>
          <div className="space-y-2">
            {qualityAttrs.map((attr, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Label"
                  value={attr.label}
                  onChange={(e) => updateAttr(i, "label", e.target.value)}
                />
                <input
                  className="w-28 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Value"
                  value={attr.value}
                  onChange={(e) => updateAttr(i, "value", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeAttrRow(i)}
                  className="text-neutral-400 hover:text-red-500 text-sm px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addAttrRow}
            className="text-emerald-700 text-xs mt-2 hover:underline"
          >
            + Add another field
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Date of Testing</label>
            <input
              type="date"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.date_of_testing}
              onChange={(e) => setForm({ ...form, date_of_testing: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Date of Packing</label>
            <input
              type="date"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.manufacturing_date}
              onChange={(e) => setForm({ ...form, manufacturing_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Valid Up To</label>
            <input
              type="date"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Net Weight</label>
            <input
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.net_weight}
              onChange={(e) => setForm({ ...form, net_weight: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">MRP (₹)</label>
            <input
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.mrp}
              onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">USP (₹)</label>
            <input
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              value={form.usp}
              onChange={(e) => setForm({ ...form, usp: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500">Uses</label>
          <textarea
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
            rows={2}
            value={form.uses}
            onChange={(e) => setForm({ ...form, uses: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500">Instructions</label>
          <textarea
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
            rows={3}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-emerald-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-4 py-2.5 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
