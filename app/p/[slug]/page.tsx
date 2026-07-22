import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";

async function getBatch(slug: string) {
  const { data, error } = await supabaseAdmin
    .from("batches")
    .select(
      `id, company_id, batch_number, manufacturing_date, expiry_date, quantity, quantity_unit,
       products ( name, category, uses, instructions, image_url )`
    )
    .eq("qr_slug", slug)
    .single();

  if (error || !data) return null;

  // Log the scan (fire and forget)
  supabaseAdmin
    .from("scan_requests")
    .insert({ batch_id: data.id, company_id: data.company_id })
    .then(() => {});

  return data as any;
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const batch = await getBatch(slug);

  if (!batch) return notFound();

  const product = Array.isArray(batch.products) ? batch.products[0] : batch.products;

  return (
    <main className="min-h-screen bg-neutral-50 flex justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-emerald-700 text-white px-6 py-5">
          <p className="text-emerald-100 text-xs uppercase tracking-wide">
            Verified Product
          </p>
          <h1 className="text-xl font-semibold mt-1">{product?.name}</h1>
          {product?.category && (
            <p className="text-emerald-100 text-sm mt-0.5 capitalize">
              {product.category}
            </p>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-400">Batch Number</p>
              <p className="font-medium text-neutral-900">{batch.batch_number}</p>
            </div>
            <div>
              <p className="text-neutral-400">Quantity</p>
              <p className="font-medium text-neutral-900">
                {batch.quantity ? `${batch.quantity} ${batch.quantity_unit || ""}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-neutral-400">Manufacturing Date</p>
              <p className="font-medium text-neutral-900">
                {batch.manufacturing_date || "—"}
              </p>
            </div>
            <div>
              <p className="text-neutral-400">Expiry Date</p>
              <p className="font-medium text-neutral-900">
                {batch.expiry_date || "—"}
              </p>
            </div>
          </div>

          {product?.uses && (
            <div>
              <p className="text-neutral-400 text-sm mb-1">Uses</p>
              <p className="text-neutral-800 text-sm leading-relaxed">{product.uses}</p>
            </div>
          )}

          {product?.instructions && (
            <div>
              <p className="text-neutral-400 text-sm mb-1">Instructions</p>
              <p className="text-neutral-800 text-sm leading-relaxed whitespace-pre-line">
                {product.instructions}
              </p>
            </div>
          )}

          {/* WhatsApp delivery — placeholder for the next phase.
              Wire this button to /api/whatsapp-send once the WhatsApp
              provider is set up. Left visible (disabled) so the client
              demo shows the full intended flow. */}
          <div className="pt-3 border-t border-neutral-100">
            <p className="text-neutral-400 text-xs mb-2">
              Get these details on WhatsApp
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Enter WhatsApp number"
                disabled
                className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-neutral-50 text-neutral-400"
              />
              <button
                disabled
                className="bg-neutral-200 text-neutral-500 text-sm font-medium px-4 py-2 rounded-lg cursor-not-allowed"
              >
                Send
              </button>
            </div>
            <p className="text-neutral-300 text-xs mt-1">Coming soon</p>
          </div>
        </div>
      </div>
    </main>
  );
}
