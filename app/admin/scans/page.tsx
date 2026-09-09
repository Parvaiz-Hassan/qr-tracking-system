"use client";

import { useEffect, useState } from "react";

type Scan = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  location_status: string | null;
  created_at: string;
  batches:
    | { batch_number: string; products: { name: string } | { name: string }[] }
    | { batch_number: string; products: { name: string } | { name: string }[] }[];
};

export default function ScanLogPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scans")
      .then((r) => r.json())
      .then((data) => {
        setScans(data.scans || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Scan Log</h1>
      <p className="text-neutral-500 text-sm mb-6">
        Every completed verification (name + phone submitted), most recent first.
      </p>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase text-left">
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5">Batch</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Phone</th>
              <th className="px-4 py-2.5">Location</th>
              <th className="px-4 py-2.5">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && scans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  No scans yet.
                </td>
              </tr>
            )}
            {scans.map((s) => {
              const batch = Array.isArray(s.batches) ? s.batches[0] : s.batches;
              const product = batch
                ? Array.isArray(batch.products)
                  ? batch.products[0]
                  : batch.products
                : null;
              return (
                <tr key={s.id} className="border-t border-neutral-50">
                  <td className="px-4 py-2.5">{product?.name || "—"}</td>
                  <td className="px-4 py-2.5 text-neutral-500">{batch?.batch_number || "—"}</td>
                  <td className="px-4 py-2.5">{s.customer_name || "—"}</td>
                  <td className="px-4 py-2.5">{s.customer_phone || "—"}</td>
                  <td className="px-4 py-2.5 text-neutral-500">
                    {s.latitude && s.longitude
                      ? `${s.latitude.toFixed(3)}, ${s.longitude.toFixed(3)}`
                      : locationStatusLabel(s.location_status)}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500">
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function locationStatusLabel(status: string | null) {
  switch (status) {
    case "denied":
      return "Denied by customer";
    case "timed_out":
      return "Timed out";
    case "unsupported":
      return "Not supported";
    case "unavailable":
      return "Unavailable";
    default:
      return "—";
  }
}
