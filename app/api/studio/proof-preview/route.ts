import { NextResponse } from "next/server";
import { getDb, printAreaSpecs, eq } from "@/lib/db";
import { getStudioExportById } from "@/lib/studio-exports";
import {
  uploadFileByUrl,
  createMockupTask,
  getMockupTaskResult,
  isPrintfulConfigured,
  type MockupGenerationFile,
} from "@/lib/printful";
import {
  parsePrintAreaSpec,
  resolvePrintArea,
  type PrintAreaSpecData,
} from "@/lib/print-area-specs";
import { resolveMockupPlacementForPrintful } from "@/lib/proof-preview-mockup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_POLLS = 20;
const POLL_INTERVAL_MS = 3000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Lowercase for matching only; keep Printful placement names (front, back, inside, …). */
function normalizePlacement(value: string): string {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "default";
  return raw;
}

function resolveOrigin(req: Request): string | null {
  const explicitOrigin = req.headers.get("origin");
  if (explicitOrigin) return explicitOrigin;

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host");
  if (!host) return null;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

/**
 * Printful mockup-generator often requires `files[].position` (area + image box).
 * Resolve from synced PrintAreaSpec for this variant + placement; try front/default aliases.
 */
function mockupPositionFromPrintSpec(
  specData: PrintAreaSpecData | null,
  variantId: number,
  placement: string
): MockupGenerationFile["position"] | null {
  if (!specData) return null;
  const tryPlacements = [placement];
  if (placement === "front") tryPlacements.push("default");
  if (placement === "default") tryPlacements.push("front");
  for (const p of tryPlacements) {
    const r = resolvePrintArea(specData, variantId, p);
    if (r) {
      return {
        area_width: r.width,
        area_height: r.height,
        width: r.width,
        height: r.height,
        top: 0,
        left: 0,
      };
    }
  }
  return null;
}

/** Printful's servers must fetch the design PNG from this host — localhost won't work. */
function isPublicReachableOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return false;
    if (h.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const printfulProductId = Math.trunc(Number(body?.printfulProductId));
    const printfulVariantId = Math.trunc(Number(body?.printfulVariantId));
    const studioExportId = String(body?.studioExportId || "").trim();
    const requestedPlacement = normalizePlacement(String(body?.placement || ""));

    if (!Number.isFinite(printfulProductId) || printfulProductId <= 0) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PRINTFUL_PRODUCT_ID",
          error: "Invalid or missing printfulProductId.",
          hint: "Set Printful product ID on the shop product or variant matrix in admin.",
        },
        { status: 400 }
      );
    }
    if (!Number.isFinite(printfulVariantId) || printfulVariantId <= 0) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PRINTFUL_VARIANT_ID",
          error: "Invalid or missing printfulVariantId.",
          hint: "Set Printful variant ID on the shop product or variant matrix in admin.",
        },
        { status: 400 }
      );
    }
    if (!studioExportId) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_EXPORT_ID",
          error: "studioExportId is required.",
        },
        { status: 400 }
      );
    }

    if (!isPrintfulConfigured()) {
      return NextResponse.json(
        {
          success: false,
          code: "PRINTFUL_NOT_CONFIGURED",
          error: "Printful API is not configured (missing PRINTFUL_TOKEN).",
          hint: "Add PRINTFUL_TOKEN (and optionally PRINTFUL_STORE_ID) to your server environment.",
        },
        { status: 503 }
      );
    }

    const exportRecord = getStudioExportById(studioExportId);
    if (!exportRecord || exportRecord.source !== "studio") {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_STUDIO_EXPORT",
          error: "Invalid or expired studio export. Try generating the proof again.",
        },
        { status: 400 }
      );
    }

    const fallbackPlacement = normalizePlacement(
      String(exportRecord.placements?.[0] || "default")
    );
    const placement = requestedPlacement || fallbackPlacement;

    const exportFile =
      exportRecord.files.find(
        (file) => normalizePlacement(file.placement) === placement
      ) || null;

    if (!exportFile) {
      return NextResponse.json(
        {
          success: false,
          code: "PLACEMENT_NOT_FOUND",
          error: `Placement "${placement}" not found in studio export.`,
          placements: exportRecord.placements || [],
          hint: "Surface → Printful placement mapping may not match exported files. Check print specs / surface map in admin.",
        },
        { status: 400 }
      );
    }

    let origin = resolveOrigin(req);
    const envPublic =
      String(process.env.STUDIO_PROOF_PUBLIC_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || "").trim() ||
      null;
    if (envPublic) {
      const normalized = envPublic.replace(/\/$/, "");
      if (isPublicReachableOrigin(normalized)) {
        if (!origin || !isPublicReachableOrigin(origin)) {
          origin = normalized;
        }
      }
    }

    if (!origin) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_REQUEST_ORIGIN",
          error: "Could not determine request origin to build a public URL for the design file.",
          hint: "Ensure Host / X-Forwarded-Host headers are set correctly on your deployment.",
        },
        { status: 400 }
      );
    }

    if (!isPublicReachableOrigin(origin)) {
      return NextResponse.json(
        {
          success: false,
          code: "DESIGN_URL_NOT_PUBLIC",
          error: "Printful cannot download your design from this server address.",
          hint:
            "Use a deployed HTTPS URL or set STUDIO_PROOF_PUBLIC_ORIGIN (or NEXT_PUBLIC_APP_URL) to a tunnel/staging base URL Printful can reach. Localhost will not work because Printful fetches the PNG from your site.",
        },
        { status: 400 }
      );
    }

    const designFileUrl = new URL(exportFile.relativeUrl, origin).toString();

    let uploaded: { id: number; url: string };
    try {
      uploaded = await uploadFileByUrl(
        designFileUrl,
        `studio-proof-${studioExportId}-${placement}.png`
      );
    } catch (uploadErr: any) {
      const msg = uploadErr?.message || "Printful file upload failed";
      return NextResponse.json(
        {
          success: false,
          code: "PRINTFUL_FILE_UPLOAD_FAILED",
          error: msg,
          hint: "Printful must fetch your export URL successfully. Confirm the file is reachable at the URL above and credentials are valid.",
        },
        { status: 502 }
      );
    }

    const db = await getDb();
    const specRow =
      (
        await db
          .select()
          .from(printAreaSpecs)
          .where(eq(printAreaSpecs.printfulProductId, printfulProductId))
          .limit(1)
      )[0] ?? null;
    const specData = specRow ? parsePrintAreaSpec(specRow) : null;
    const mockupPlacement = resolveMockupPlacementForPrintful(
      specData,
      printfulProductId,
      placement
    );
    const position = mockupPositionFromPrintSpec(
      specData,
      printfulVariantId,
      mockupPlacement
    );

    const mockupFile: MockupGenerationFile = {
      placement: mockupPlacement,
      image_url: uploaded.url,
      ...(position ? { position } : {}),
    };

    let task: { task_key: string };
    try {
      task = await createMockupTask(printfulProductId, {
        variant_ids: [printfulVariantId],
        format: "jpg",
        files: [mockupFile],
      });
    } catch (mockupErr: any) {
      return NextResponse.json(
        {
          success: false,
          code: "PRINTFUL_MOCKUP_TASK_FAILED",
          error: mockupErr?.message || "Failed to start Printful mockup task.",
          hint: "Check product / variant IDs and placement name for this Printful catalog product.",
        },
        { status: 502 }
      );
    }

    let result: Awaited<ReturnType<typeof getMockupTaskResult>> | null = null;
    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(POLL_INTERVAL_MS);
      const polled = await getMockupTaskResult(task.task_key);
      if (polled.status === "completed") {
        result = polled;
        break;
      }
      if (polled.status === "error") {
        return NextResponse.json(
          {
            success: false,
            code: "PRINTFUL_MOCKUP_ERROR",
            error: polled.error || "Printful reported an error while generating the mockup.",
            hint: "Verify placement and artwork dimensions match the Printful template.",
          },
          { status: 500 }
        );
      }
    }

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          code: "PRINTFUL_POLL_TIMEOUT",
          error: `Print proof generation timed out after ${MAX_POLLS} polls.`,
          hint: "Try again; Printful may be slow. If it persists, check Printful status and product configuration.",
        },
        { status: 504 }
      );
    }

    const mockup = result.mockups?.[0];
    if (!mockup?.mockup_url) {
      return NextResponse.json(
        {
          success: false,
          code: "PRINTFUL_NO_MOCKUP_URL",
          error: "Printful completed the task but returned no mockup image URL.",
          hint: "The variant or placement may not support mockups for this product.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      placement: mockup.placement || placement,
      previewUrl: mockup.mockup_url,
      extra: mockup.extra || [],
    });
  } catch (err: any) {
    const msg = err?.message || "Proof preview generation failed";
    const code =
      /PRINTFUL_TOKEN|Missing PRINTFUL/i.test(msg) ? "PRINTFUL_NOT_CONFIGURED" : "UNEXPECTED_ERROR";
    return NextResponse.json(
      {
        success: false,
        code,
        error: msg,
        hint:
          code === "PRINTFUL_NOT_CONFIGURED"
            ? "Set PRINTFUL_TOKEN in the server environment."
            : undefined,
      },
      { status: 500 }
    );
  }
}
