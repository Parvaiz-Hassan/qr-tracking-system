import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
          Product QR Tracking — Demo
        </h1>
        <p className="text-neutral-500 text-sm mb-6">
          Go to the admin panel to add a product batch and generate its QR
          code. Scan the QR (or open its link) to see the customer-facing
          verification page.
        </p>
        <Link
          href="/admin"
          className="inline-block bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-800"
        >
          Go to Admin Panel
        </Link>
      </div>
    </main>
  );
}
