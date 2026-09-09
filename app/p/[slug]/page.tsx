"use client";

import { useState, use } from "react";
import { detailLabelFor } from "@/lib/categories";

type Company = {
  name: string;
  logo_url: string | null;
  tagline: string | null;
  thank_you_message: string | null;
};

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
        sub_category: string | null;
        uses: string;
        instructions: string;
        image_url: string | null;
      }
    | Array<{
        name: string;
        variety: string | null;
        category: string;
        sub_category: string | null;
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
  const [company, setCompany] = useState<Company | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Best-effort silent location — never blocks the flow either way.
    // Generous timeout since GPS can take a few seconds indoors. We also
    // record WHY it failed (denied/timed out/unsupported) so the admin
    // scan log can distinguish "customer said no" from an actual bug,
    // instead of just showing a blank dash either way.
    let latitude: number | null = null;
    let longitude: number | null = null;
    let locationStatus = "unsupported";

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            enableHighAccuracy: false,
          });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
        locationStatus = "granted";
      } catch (geoErr: any) {
        if (geoErr?.code === 1) locationStatus = "denied";
        else if (geoErr?.code === 3) locationStatus = "timed_out";
        else locationStatus = "unavailable";
      }
    }

    try {
      const res = await fetch(`/api/verify/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, latitude, longitude, locationStatus }),
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
        setCompany(data.company);
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
    return <ResultScreen batch={batch} company={company} />;
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

function ResultScreen({ batch, company }: { batch: BatchData; company: Company | null }) {
  const product = Array.isArray(batch.products) ? batch.products[0] : batch.products;
  const quality = batch.batch_attributes
    .filter((a) => a.section === "quality")
    .sort((a, b) => a.sort_order - b.sort_order);

  const companyName = company?.name || "";
  const cropLabel = detailLabelFor(product?.category || "");

  const traceabilityRows = [
    batch.date_of_testing && { label: "Date of Testing", value: batch.date_of_testing },
    batch.manufacturing_date && { label: "Date of Packing", value: batch.manufacturing_date },
    batch.expiry_date && { label: "Valid Up To", value: batch.expiry_date },
    batch.net_weight && { label: "Net Weight", value: batch.net_weight },
    batch.mrp && { label: "Maximum Retail Price (MRP)", value: `₹${batch.mrp} (Inclusive of all taxes)` },
    batch.usp && { label: "Unit Sale Price (USP)", value: `₹${batch.usp}` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <main className="min-h-screen bg-neutral-50 flex justify-center px-3 py-4">
      <div className="w-full max-w-md">
        {/* Company header */}
        {(company?.logo_url || companyName) && (
          <div className="bg-white border border-neutral-200 rounded-2xl flex items-center gap-2 px-4 py-3 mb-3">
            {company?.logo_url && (
              <img src={company.logo_url} alt={companyName} className="h-8 object-contain" />
            )}
            {!company?.logo_url && companyName && (
              <p className="font-bold text-neutral-900">{companyName}</p>
            )}
          </div>
        )}

        {/* Verified banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-5 text-center mb-3">
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckIcon />
          </div>
          <h1 className="text-emerald-800 font-bold text-lg">PRODUCT VERIFIED</h1>
          <p className="text-emerald-700 text-sm mt-0.5">
            This is a genuine {companyName ? `${companyName} ` : ""}product.
          </p>
        </div>

        {/* Product summary */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center gap-4 mb-3">
          {product?.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-20 h-20 rounded-lg object-cover border border-neutral-100 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-neutral-100 flex-shrink-0" />
          )}
          <div className="text-sm space-y-1 flex-1 min-w-0">
            <Row label={cropLabel} value={product?.name} />
            {product?.sub_category && <Row label="Type" value={product.sub_category} />}
            {product?.variety && <Row label="Variety" value={product.variety} />}
            <Row label="Lot No." value={batch.batch_number} />
            {batch.label_number && <Row label="Label No." value={batch.label_number} />}
          </div>
        </div>

        {/* Quality & test details */}
        {quality.length > 0 && (
          <Section title={`${product?.category === "fertilizer" ? "Product" : "Seed"} Quality & Test Details`} icon={<FlaskIcon />}>
            {quality.map((q, i) => (
              <DetailRow key={i} label={q.label} value={q.value} index={i} />
            ))}
          </Section>
        )}

        {/* Traceability & pack details */}
        {traceabilityRows.length > 0 && (
          <Section title="Traceability & Pack Details" icon={<CalendarIcon />}>
            {traceabilityRows.map((r, i) => (
              <DetailRow key={i} label={r.label} value={r.value} index={i} />
            ))}
          </Section>
        )}

        {/* Authenticity status */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 mt-3">
          <p className="text-emerald-800 font-medium text-sm mb-2.5 flex items-center gap-2">
            <ShieldIcon /> Authenticity Status
          </p>
          <div className="bg-emerald-50 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckIcon small />
            </div>
            <p className="text-emerald-800 text-sm font-medium">
              QR verified &bull; Lot traceable &bull; QC record available
            </p>
          </div>
        </div>

        {companyName && (
          <p className="text-neutral-400 text-xs text-center mt-3 px-4">
            ⓘ Scan result linked to {companyName} production and quality
            records.
          </p>
        )}

        {company?.thank_you_message && (
          <p className="text-neutral-500 text-xs text-center mt-3 px-4 leading-relaxed">
            {company.thank_you_message}
          </p>
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
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden mb-3">
      <div className="bg-emerald-50 px-4 py-2 flex items-center gap-2 text-emerald-700">
        {icon}
        <p className="text-emerald-800 font-semibold text-xs uppercase tracking-wide">
          {title}
        </p>
      </div>
      <div>{children}</div>
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

function DetailRow({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <div
      className={`flex justify-between px-4 py-1.5 text-sm ${
        index % 2 === 0 ? "bg-neutral-50" : "bg-white"
      }`}
    >
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-900">: {value}</span>
    </div>
  );
}

function FlaskIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <path
        d="M9 2v6.5L4.5 17a2 2 0 001.8 3h11.4a2 2 0 001.8-3L15 8.5V2M9 2h6M9 13h6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <rect x={3} y={5} width={18} height={16} rx={2} stroke="currentColor" strokeWidth={2} />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ small }: { small?: boolean }) {
  const size = small ? 16 : 24;
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
