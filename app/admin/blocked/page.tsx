"use client";

import { useEffect, useState } from "react";

type Blocked = {
  id: string;
  batch_number: string;
  qr_slug: string;
  product_name: string;
  scan_count: number;
};

export default function BlockedPage() {
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/blocked");
    const data = await res.json();
    setBlocked(data.blocked || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReset(id: string) {
    if (!confirm("Reset this QR code's scan count and unblock it?")) return;
    setResettingId(id);
    await fetch(`/api/blocked/${id}/reset`, { method: "POST" });
    setResettingId(null);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Blocked QR Codes</h1>
      <p className="text-neutral-500 text-sm mb-6">
        These QR codes have been scanned more than 3 times and no longer show
        product details to customers. Reset a code if the block was a false
        positive.
      </p>

      {loading && <p className="text-neutral-400 text-sm">Loading...</p>}

      {!loading && blocked.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center text-neutral-400 text-sm">
          No blocked QR codes right now.
        </div>
      )}

      <div className="space-y-3">
        {blocked.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-amber-200 rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-neutral-900">{b.product_name}</p>
              <p className="text-neutral-500 text-xs">{b.batch_number}</p>
              <p className="text-amber-700 text-xs mt-1">
                Scanned {b.scan_count} times
              </p>
            </div>
            <button
              onClick={() => handleReset(b.id)}
              disabled={resettingId === b.id}
              className="text-sm bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              {resettingId === b.id ? "Resetting..." : "Reset & Unblock"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
