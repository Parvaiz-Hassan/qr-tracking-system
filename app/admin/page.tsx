"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Overview = {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  totalProducts: number;
  blockedCount: number;
  mostScanned: { id: string; batch_number: string; product_name: string; scan_count: number }[];
};

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <div className="max-w-6xl mx-auto px-4 py-10 text-neutral-400 text-sm">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Scans" value={data.totalScans} />
        <StatCard label="Scans Today" value={data.scansToday} />
        <StatCard label="Scans This Week" value={data.scansThisWeek} />
        <StatCard
          label="Blocked QR Codes"
          value={data.blockedCount}
          highlight={data.blockedCount > 0}
        />
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        <h2 className="font-medium text-neutral-900 mb-4">Most Scanned Products</h2>
        {data.mostScanned.length === 0 ? (
          <p className="text-neutral-400 text-sm">No scans yet.</p>
        ) : (
          <div className="space-y-2">
            {data.mostScanned.map((b) => (
              <div key={b.id} className="flex justify-between text-sm py-2 border-b border-neutral-50 last:border-0">
                <span className="text-neutral-800">
                  {b.product_name} <span className="text-neutral-400">({b.batch_number})</span>
                </span>
                <span className="font-medium text-neutral-900">{b.scan_count} scans</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.blockedCount > 0 && (
        <p className="text-sm text-amber-700 mt-4">
          {data.blockedCount} batch{data.blockedCount === 1 ? "" : "es"} currently blocked from
          showing details.{" "}
          <Link href="/admin/blocked" className="underline font-medium">
            Review blocked QR codes
          </Link>
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-2xl p-4 ${
        highlight ? "border-amber-300" : "border-neutral-200"
      }`}
    >
      <p className="text-neutral-400 text-xs">{label}</p>
      <p
        className={`text-2xl font-semibold mt-1 ${
          highlight ? "text-amber-700" : "text-neutral-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
