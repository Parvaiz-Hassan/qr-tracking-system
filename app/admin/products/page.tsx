"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORY_OPTIONS, CategoryKey } from "@/lib/categories";

type QualityAttr = { label: string; value: string };

type BatchRow = {
  id: string;
  batch_number: string;
  qr_slug: string;
  label_number: string | null;
  scan_count: number;
  products:
    | { id: string; name: string; variety: string | null; category: string; sub_category: string | null; image_url: string | null }
    | Array<{ id: string; name: string; variety: string | null; category: string; sub_category: string | null; image_url: string | null }>;
};

const SCAN_LIMIT = 3;

export default function AdminPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [qualityAttrs, setQualityAttrs] = useState<QualityAttr[]>([
    { label: "", value: "" },
  ]);

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

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function loadBatches() {
    const res = await fetch("/api/products");
    const data = await res.json();
    if (data.batches) setBatches(data.batches);
  }

  useEffect(() => {
    loadBatches();
  }, []);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let image_url: string | null = null;

      if (imageFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        setUploading(false);

        if (!uploadRes.ok) {
          setError(uploadData.error || "Image upload failed.");
          setLoading(false);
          return;
        }
        image_url = uploadData.url;
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          image_url,
          quality_attributes: qualityAttrs.filter((a) => a.label && a.value),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setForm({
          name: "",
          variety: "",
          category: "seed",
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
        setImageFile(null);
        setImagePreview("");
        setQualityAttrs([{ label: "", value: "" }]);
        loadBatches();
      }
    } catch (err) {
      setError("Network error — check your Supabase setup in .env.local");
    } finally {
      setLoading(false);
    }
  }

  function qrImageUrl(slug: string) {
    const target = `${baseUrl}/p/${slug}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      target
    )}`;
  }

  // High resolution + high error-correction, suitable for print on
  // pouches/bags/boxes. Opened in a new tab (not force-downloaded) so
  // it can be right-clicked/saved or printed directly at full size.
  function qrPrintUrl(slug: string) {
    const target = `${baseUrl}/p/${slug}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&ecc=H&margin=10&data=${encodeURIComponent(
      target
    )}`;
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this batch? This can't be undone.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadBatches();
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          Product & Batch Admin
        </h1>
        <p className="text-neutral-500 text-sm mb-8">
          Add a product batch, get its QR code, print it and stick it on the
          pack.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 h-fit"
          >
            <h2 className="font-medium text-neutral-900">New Product Batch</h2>

            <div>
              <label className="text-xs text-neutral-500">Product Image</label>
              <div className="flex items-center gap-3 mt-1">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-14 h-14 rounded-lg object-cover border border-neutral-200"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500">Crop / Product Name *</label>
                <input
                  required
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tomato"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Variety</label>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.variety}
                  onChange={(e) => setForm({ ...form, variety: e.target.value })}
                  placeholder="e.g. Monso Red"
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
                      sub_category: "", // reset when category changes
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
                  placeholder="e.g. TR24MR001"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Label No.</label>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.label_number}
                  onChange={(e) => setForm({ ...form, label_number: e.target.value })}
                  placeholder="e.g. LBL24056789"
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-neutral-500 mb-2">
                Seed Quality & Test Details
              </p>
              <div className="space-y-2">
                {qualityAttrs.map((attr, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="Label (e.g. Germination Min.)"
                      value={attr.label}
                      onChange={(e) => updateAttr(i, "label", e.target.value)}
                    />
                    <input
                      className="w-28 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="Value (e.g. 96%)"
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
                  placeholder="500 g"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">MRP (₹)</label>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                  placeholder="850.00"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">USP (₹)</label>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.usp}
                  onChange={(e) => setForm({ ...form, usp: e.target.value })}
                  placeholder="1.70 / g"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading
                ? uploading
                  ? "Uploading image..."
                  : "Generating..."
                : "Create Batch & QR Code"}
            </button>
          </form>

          {/* List */}
          <div className="space-y-4">
            <h2 className="font-medium text-neutral-900">
              Batches ({batches.length})
            </h2>
            {batches.length === 0 && (
              <p className="text-neutral-400 text-sm">
                No batches yet — add one on the left.
              </p>
            )}
            {batches.map((b) => {
              const product = Array.isArray(b.products) ? b.products[0] : b.products;
              const overLimit = b.scan_count > SCAN_LIMIT;
              return (
                <div
                  key={b.id}
                  className="bg-white border border-neutral-200 rounded-2xl p-5 flex gap-4"
                >
                  <img
                    src={qrImageUrl(b.qr_slug)}
                    alt="QR code"
                    className="w-24 h-24 rounded-lg border border-neutral-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900">{product?.name}</p>
                      {product?.variety && (
                        <span className="text-neutral-400 text-xs">
                          ({product.variety})
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-500 text-xs">{b.batch_number}</p>
                    <a
                      href={`/p/${b.qr_slug}`}
                      target="_blank"
                      className="text-emerald-700 text-xs underline break-all"
                    >
                      {baseUrl}/p/{b.qr_slug}
                    </a>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          overLimit
                            ? "bg-red-100 text-red-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        Scanned {b.scan_count} time{b.scan_count === 1 ? "" : "s"}
                        {overLimit ? " — blocked" : ""}
                      </span>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <a
                        href={qrPrintUrl(b.qr_slug) + "&format=png"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded"
                      >
                        Download QR (print quality)
                      </a>
                      <Link
                        href={`/admin/products/${b.id}/edit`}
                        className="text-xs bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-xs bg-neutral-100 hover:bg-red-100 hover:text-red-600 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
