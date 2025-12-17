import { NextResponse } from "next/server";

// Placeholder: QR + composite generator
// TODO: implement using qrcode and sharp, upload to WP media via REST, save qr_url/print_url
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Expect: { token, designUrl, template, qrTargetUrl }
    // 1) Generate QR for qrTargetUrl
    // 2) Composite QR onto design/template
    // 3) Upload files to WP media (or S3) and return URLs
    // For now, return stub
    return NextResponse.json({ ok: true, message: "Compose stub", input: body }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
