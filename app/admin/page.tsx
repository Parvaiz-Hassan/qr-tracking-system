"use client";

import { useEffect, useState } from "react";

type BatchRow = {
  id: string;
  batch_number: string;
  qr_slug: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  quantity: number | null;
  quantity_unit: string | null;
  products: { id: string; name: string; category: string; uses: string; instructions: string } | { id: string; name: string; category: string; uses: string; instructions: string }[];
};

export default function AdminPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "seed",
    uses: "",
    instructions: "",
    batch_number: "",
    manufacturing_date: "",
    expiry_date: "",
    quantity: "",
    quantity_unit: "kg",
  });

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  async function loadBatches() {
    const res = await fetch("/api/products");
    const data = await res.json();
    if (data.batches) setBatches(data.batches);
  }

  useEffect(() => {
    loadBatches();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setForm({
          name: "",
          category: "seed",
          uses: "",
          instructions: "",
          batch_number: "",
          manufacturing_date: "",
          expiry_date: "",
          quantity: "",
          quantity_unit: "kg",
        });
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
              <label className="text-xs text-neutral-500">Product Name *</label>
              <input
                required
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Hybrid Wheat Seeds"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-500">Category</label>
              <select
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="seed">Seed</option>
                <option value="fertilizer">Fertilizer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-neutral-500">Batch Number *</label>
              <input
                required
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                value={form.batch_number}
                onChange={(e) =>
                  setForm({ ...form, batch_number: e.target.value })
                }
                placeholder="e.g. JPA-SEED-WHEAT-24B-0417"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500">Mfg. Date</label>
                <input
                  type="date"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.manufacturing_date}
                  onChange={(e) =>
                    setForm({ ...form, manufacturing_date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Expiry Date</label>
                <input
                  type="date"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.expiry_date}
                  onChange={(e) =>
                    setForm({ ...form, expiry_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500">Quantity</label>
                <input
                  type="number"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  placeholder="50"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Unit</label>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.quantity_unit}
                  onChange={(e) =>
                    setForm({ ...form, quantity_unit: e.target.value })
                  }
                  placeholder="kg / bags"
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
                placeholder="Suitable for rabi season wheat cultivation..."
              />
            </div>

            <div>
              <label className="text-xs text-neutral-500">Instructions</label>
              <textarea
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
                rows={3}
                value={form.instructions}
                onChange={(e) =>
                  setForm({ ...form, instructions: e.target.value })
                }
                placeholder="Sow at 2-3 cm depth, water every..."
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Create Batch & QR Code"}
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
              const product = Array.isArray(b.products)
                ? b.products[0]
                : b.products;
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
                    <p className="font-medium text-neutral-900">
                      {product?.name}
                    </p>
                    <p className="text-neutral-500 text-xs">
                      {b.batch_number}
                    </p>
                    <a
                      href={`/p/${b.qr_slug}`}
                      target="_blank"
                      className="text-emerald-700 text-xs underline break-all"
                    >
                      {baseUrl}/p/{b.qr_slug}
                    </a>
                    <div className="mt-2">
                      <a
                        href={qrImageUrl(b.qr_slug) + "&format=png"}
                        download={`qr-${b.batch_number}.png`}
                        className="text-xs bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded"
                      >
                        Download QR
                      </a>
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
