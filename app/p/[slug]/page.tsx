"use client";

import { useState, use } from "react";

type BatchData = {
  batch_number: string;
  label_number: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  date_of_testing: string | null;
  net_weight: string | null;
  mrp: string | null;
  usp: string | null;
  products:
    | {
        name: string;
        variety: string | null;
        category: string;
        uses: string;
        instructions: string;
        image_url: string | null;
      }
    | Array<{
        name: string;
        variety: string | null;
        category: string;
        uses: string;
        instructions: string;
        image_url: string | null;
      }>;
  batch_attributes: { section: string; label: string; value: string; sort_order: number }[];
};

export default function VerifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [stage, setStage] = useState<"gate" | "blocked" | "result" | "notfound">("gate");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [batch, setBatch] = useState<BatchData | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Best-effort silent location — never blocks the flow either way.
    let latitude: number | null = null;
    let longitude: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject();
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2000 });
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch {
      // Silently ignore — denied, unsupported, or timed out. Proceed anyway.
    }

    try {
      const res = await fetch(`/api/verify/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, latitude, longitude }),
      });

      if (res.status === 404) {
        setStage("notfound");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      if (data.blocked) {
        setStage("blocked");
      } else {
        setBatch(data.batch);
        setStage("result");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "notfound") {
    return (
      <Centered>
        <p className="text-neutral-500 text-sm">
          This QR code doesn't match any product on record.
        </p>
      </Centered>
    );
  }

  if (stage === "blocked") {
    return (
      <Centered>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 font-semibold mb-1">
            This QR code has been scanned multiple times
          </p>
          <p className="text-amber-700 text-sm">
            For your safety, product details are no longer shown for this
            code. This can happen if a code has been duplicated. Please
            contact the manufacturer if you have concerns about this
            product's authenticity.
          </p>
        </div>
      </Centered>
    );
  }

  if (stage === "result" && batch) {
    return <ResultScreen batch={batch} />;
  }

  // Gate: name + phone
  return (
    <Centered>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <h1 className="text-lg font-semibold text-neutral-900 mb-1">
          Verify This Product
        </h1>
        <p className="text-neutral-500 text-sm mb-5">
          Enter your details to view the product's verification information.
        </p>
        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <label className="text-xs text-neutral-500">Your Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Phone Number</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-emerald-800 disabled:opacity-50 mt-2"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-10">
      {children}
    </main>
  );
}

function ResultScreen({ batch }: { batch: BatchData }) {
  const product = Array.isArray(batch.products) ? batch.products[0] : batch.products;
  const quality = batch.batch_attributes
    .filter((a) => a.section === "quality")
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <main className="min-h-screen bg-neutral-50 flex justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Verified banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-6 text-center mb-4">
          <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckIcon />
          </div>
          <h1 className="text-emerald-800 font-bold text-xl">PRODUCT VERIFIED</h1>
          <p className="text-emerald-700 text-sm mt-1">
            This is a genuine {product?.name ? "" : ""}product.
          </p>
        </div>

        {/* Product summary */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex gap-4 mb-4">
          {product?.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-20 h-20 rounded-lg object-cover border border-neutral-100 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-neutral-100 flex-shrink-0" />
          )}
          <div className="text-sm space-y-1 flex-1">
            <Row label="Crop" value={product?.name} />
            {product?.variety && <Row label="Variety" value={product.variety} />}
            <Row label="Lot No." value={batch.batch_number} />
            {batch.label_number && <Row label="Label No." value={batch.label_number} />}
          </div>
        </div>

        {/* Quality & test details */}
        {quality.length > 0 && (
          <Section title="Seed Quality & Test Details" icon="🧪">
            {quality.map((q, i) => (
              <DetailRow key={i} label={q.label} value={q.value} />
            ))}
          </Section>
        )}

        {/* Traceability & pack details */}
        <Section title="Traceability & Pack Details" icon="📅">
          {batch.date_of_testing && (
            <DetailRow label="Date of Testing" value={batch.date_of_testing} />
          )}
          {batch.manufacturing_date && (
            <DetailRow label="Date of Packing" value={batch.manufacturing_date} />
          )}
          {batch.expiry_date && <DetailRow label="Valid Up To" value={batch.expiry_date} />}
          {batch.net_weight && <DetailRow label="Net Weight" value={batch.net_weight} />}
          {batch.mrp && <DetailRow label="Maximum Retail Price (MRP)" value={`₹${batch.mrp}`} />}
          {batch.usp && <DetailRow label="Unit Sale Price (USP)" value={`₹${batch.usp}`} />}
        </Section>

        {/* Authenticity status */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 mt-4">
          <p className="text-emerald-800 font-medium text-sm mb-3 flex items-center gap-2">
            <span>🛡️</span> Authenticity Status
          </p>
          <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckIcon small />
            </div>
            <p className="text-emerald-800 text-sm font-medium">
              QR verified &bull; Lot traceable &bull; QC record available
            </p>
          </div>
        </div>

        {product?.uses && (
          <p className="text-neutral-500 text-xs text-center mt-4 px-4">{product.uses}</p>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden mb-4">
      <div className="bg-emerald-50 px-4 py-2.5 flex items-center gap-2">
        <span>{icon}</span>
        <p className="text-emerald-800 font-semibold text-sm uppercase tracking-wide">
          {title}
        </p>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p className="text-neutral-600">
      {label} : <span className="font-semibold text-neutral-900">{value}</span>
    </p>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-neutral-50 last:border-0 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  );
}

function CheckIcon({ small }: { small?: boolean }) {
  const size = small ? 16 : 28;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 13l4 4L19 7"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
