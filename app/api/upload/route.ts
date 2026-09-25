import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
// sharp is a native binary module. It was previously imported statically
// at the top of this file — if its prebuilt binary fails to load in
// Vercel's serverless runtime (a known sharp/Vercel gotcha, e.g. after a
// dependency or lockfile change), that import throws at MODULE LOAD TIME,
// before POST() even runs. The try/catch below only ever wrapped how
// sharp is *used*, not the import itself, so that crash was unhandled and
// took the whole function down — producing Next's generic HTML 500 crash
// page instead of a normal JSON error, which is what showed up client-side
// as a JSON-parse failure in the batch form. Fixed (2026-09-25) by loading
// sharp lazily inside the try block, so a failed load is now caught the
// same way a failed parse always was, and falls back to the original file.

// Uploaded images (logos especially) sometimes come out of a print/design
// tool with a CMYK color profile or a non-sRGB embedded profile. Browsers
// only render sRGB correctly — a CMYK or oddly-profiled JPEG/PNG can look
// noticeably darker, duller, or off-color once it's on the web page even
// though it looks fine on the designer's own computer. Fixed here (added
// 2026-09-19) by normalizing every upload to plain sRGB before it's
// stored, so this can't happen again regardless of what gets uploaded.
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const originalExt = (file.name.split(".").pop() || "jpg").toLowerCase();

  let outputBuffer: Buffer = Buffer.from(arrayBuffer);
  let outputExt = originalExt;
  let outputContentType = file.type || "application/octet-stream";

  try {
    const sharp = (await import("sharp")).default;
    const image = sharp(Buffer.from(arrayBuffer)).toColorspace("srgb");

    if (originalExt === "png") {
      outputBuffer = await image.png().toBuffer();
      outputContentType = "image/png";
    } else if (originalExt === "webp") {
      outputBuffer = await image.webp().toBuffer();
      outputContentType = "image/webp";
    } else {
      // Covers jpg/jpeg and any other photo format — re-encode as a
      // clean sRGB JPEG.
      outputBuffer = await image.jpeg({ quality: 90 }).toBuffer();
      outputExt = "jpg";
      outputContentType = "image/jpeg";
    }
  } catch {
    // If sharp can't parse it for some reason, fall back to uploading the
    // original file untouched rather than blocking the upload entirely.
  }

  const fileName = `${crypto.randomUUID()}.${outputExt}`;

  const { error } = await supabaseAdmin.storage
    .from("product-images")
    .upload(fileName, outputBuffer, {
      contentType: outputContentType,
      upsert: false,
    });

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message +
          " — make sure a public bucket named 'product-images' exists in Supabase Storage.",
      },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}
