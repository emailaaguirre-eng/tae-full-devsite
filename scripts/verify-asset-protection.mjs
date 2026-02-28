#!/usr/bin/env node
/**
 * Verify ArtKey asset-protection controls on a target environment.
 *
 * Usage:
 *   node scripts/verify-asset-protection.mjs --token <PUBLIC_TOKEN>
 *   node scripts/verify-asset-protection.mjs --token <PUBLIC_TOKEN> --base-url https://dev.theartfulexperience.com --replay-count 20
 */

const DEFAULT_BASE_URL = "https://dev.theartfulexperience.com";
const DEFAULT_REPLAY_COUNT = 20;

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    replayCount: DEFAULT_REPLAY_COUNT,
    token: "",
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base-url") {
      args.baseUrl = String(argv[++i] || "").trim() || DEFAULT_BASE_URL;
    } else if (arg === "--token") {
      args.token = String(argv[++i] || "").trim();
    } else if (arg === "--replay-count") {
      const parsed = Number(argv[++i]);
      if (Number.isFinite(parsed) && parsed > 0) args.replayCount = Math.floor(parsed);
    }
  }

  return args;
}

function countStatuses(values) {
  return values.reduce((acc, status) => {
    const key = String(status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function compact(obj) {
  return JSON.stringify(obj, null, 2);
}

function tinyPngDataUrl() {
  // 1x1 transparent PNG
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9n3sQAAAAASUVORK5CYII=";
}

async function getSignedPreviewUrl(baseUrl, token) {
  const url = `${baseUrl}/api/portal/${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Portal response is not JSON (status ${res.status})`);
  }
  if (!res.ok || !json?.success) {
    throw new Error(`Portal lookup failed (${res.status}): ${json?.error || "unknown error"}`);
  }
  const signed = json?.data?.signedGalleryPreviewUrls?.[0];
  if (!signed || typeof signed !== "string") {
    throw new Error("No signedGalleryPreviewUrls[0] returned for this token.");
  }
  return signed;
}

async function replaySignedUrl(baseUrl, signedUrl, replayCount) {
  const absoluteUrl = signedUrl.startsWith("http")
    ? signedUrl
    : `${baseUrl}${signedUrl.startsWith("/") ? "" : "/"}${signedUrl}`;

  const statuses = [];
  const samples = [];
  for (let i = 0; i < replayCount; i++) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(absoluteUrl);
    statuses.push(res.status);
    if (i < 3) {
      // eslint-disable-next-line no-await-in-loop
      const body = await res.text();
      samples.push({
        attempt: i + 1,
        status: res.status,
        contentType: res.headers.get("content-type"),
        bodyPreview: body.slice(0, 160),
      });
    }
  }

  return { statuses, counts: countStatuses(statuses), samples };
}

async function runProofSanity(baseUrl) {
  const url = `${baseUrl}/api/proof/generate`;
  const payload = {
    items: [
      {
        cartItemId: "asset-protection-sanity",
        requiresQrCode: true,
        designFiles: [{ placement: "front", dataUrl: tinyPngDataUrl() }],
        artKeyData: {
          title: "Asset Protection Sanity Portal",
          theme: {},
          features: {
            enable_gallery: true,
            enable_video: false,
            show_guestbook: true,
            enable_custom_links: true,
            enable_spotify: false,
            allow_img_uploads: true,
            allow_vid_uploads: false,
            gb_btn_view: true,
            gb_signing_status: "open",
            gb_require_approval: true,
            order: ["links", "gallery", "guestbook"],
          },
          links: [],
          spotify: { url: "", autoplay: false },
          customizations: { adminDemo: true },
          uploadedImages: [],
          uploadedVideos: [],
        },
        artKeyTemplatePosition: {
          placement: "front",
          x: 0,
          y: 0,
          width: 128,
          height: 128,
          templateId: "artkey-elegant",
        },
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    // Keep raw parse failure captured below.
  }

  return {
    status: res.status,
    ok: res.ok,
    success: !!json?.success,
    portalToken: json?.proofs?.[0]?.portalToken || null,
    ownerToken: json?.proofs?.[0]?.ownerToken || null,
    proofFilesCount: Array.isArray(json?.proofs?.[0]?.proofFiles) ? json.proofs[0].proofFiles.length : 0,
    bodyPreview: text.slice(0, 300),
  };
}

async function main() {
  const { baseUrl, replayCount, token } = parseArgs(process.argv);
  if (!token) {
    console.error("Missing required --token argument.");
    process.exit(1);
  }

  const startedAt = new Date().toISOString();
  const result = {
    startedAt,
    baseUrl,
    token,
    replayCount,
    signedPreviewUrl: null,
    replay: null,
    proofSanity: null,
    errors: [],
  };

  try {
    result.signedPreviewUrl = await getSignedPreviewUrl(baseUrl, token);
  } catch (err) {
    result.errors.push(`signed-url-step: ${err?.message || String(err)}`);
  }

  if (result.signedPreviewUrl) {
    try {
      result.replay = await replaySignedUrl(baseUrl, result.signedPreviewUrl, replayCount);
    } catch (err) {
      result.errors.push(`replay-step: ${err?.message || String(err)}`);
    }
  }

  try {
    result.proofSanity = await runProofSanity(baseUrl);
  } catch (err) {
    result.errors.push(`proof-step: ${err?.message || String(err)}`);
  }

  result.finishedAt = new Date().toISOString();

  console.log("=== Asset Protection Verification Result ===");
  console.log(compact(result));

  if (result.errors.length > 0) process.exit(2);
}

main().catch((err) => {
  console.error("Fatal verification failure:", err);
  process.exit(3);
});

