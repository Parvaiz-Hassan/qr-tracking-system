"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/Pagination";
import SearchBox from "@/components/SearchBox";

const PAGE_SIZE = 10;

type Blocked = {
  id: string;
  batch_number: string;
  qr_slug: string;
  product_name: string;
  scan_count: number;
};

export default function BlockedPage() {
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (search) params.set("q", search);
    const res = await fetch(`/api/blocked?${params.toString()}`);
    const data = await res.json();
    setBlocked(data.blocked || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  function handleSearch(q: string) {
    setPage(1);
    setSearch(q);
  }

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
      <p className="text-neutral-500 text-sm mb-3">
        QR codes that have been scanned more than 3 times. Reset a code if
        the block was a false positive.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-amber-800 text-xs mb-6">
        This overall-scan-count block is currently <strong>OFF</strong> per
        client request — these QR codes are listed here for visibility
        only. Product details still show regardless of total scan count.
        A separate, active restriction now limits each individual mobile
        number to 2 verifications per QR code (see the Scan Log to check
        this). To turn this overall block back on, flip
        <code className="mx-1 px-1 bg-amber-100 rounded">ENFORCE_SCAN_LIMIT</code>
        to <code className="px-1 bg-amber-100 rounded">true</code> in
        <code className="mx-1 px-1 bg-amber-100 rounded">app/api/verify/[slug]/route.ts</code>.
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <p className="text-sm text-neutral-500">{total} total</p>
        <SearchBox
          placeholder="Search product or lot number..."
          onSearch={handleSearch}
        />
      </div>

      {loading && <p className="text-neutral-400 text-sm">Loading...</p>}

      {!loading && blocked.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center text-neutral-400 text-sm">
          {search ? "No blocked QR codes match your search." : "No blocked QR codes right now."}
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

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
