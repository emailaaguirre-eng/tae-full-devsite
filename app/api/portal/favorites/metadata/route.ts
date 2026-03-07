import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function findMetaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexes = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
        "i"
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
        "i"
      ),
    ];
    for (const regex of regexes) {
      const match = html.match(regex);
      if (match?.[1]) return decodeHtml(match[1]);
    }
  }
  return null;
}

function findTitle(html: string): string | null {
  const ogTitle = findMetaContent(html, ["og:title", "twitter:title"]);
  if (ogTitle) return ogTitle;
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!titleMatch?.[1]) return null;
  return decodeHtml(titleMatch[1]);
}

function normalizeMetaUrl(raw: string | null | undefined, base: URL): string | undefined {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed, base).toString();
  } catch {
    return undefined;
  }
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const rawUrl = requestUrl.searchParams.get("url") || "";
  if (!rawUrl) {
    return NextResponse.json({ success: false, error: "Missing url" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid url" }, { status: 400 });
  }

  if (!/^https?:$/i.test(targetUrl.protocol)) {
    return NextResponse.json({ success: false, error: "Unsupported protocol" }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; ArtKeyFavorites/1.0)",
      },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Unable to fetch URL (${response.status})` },
        { status: 200 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ success: true, data: {} }, { status: 200 });
    }

    const html = await response.text();
    const title = findTitle(html);
    const description = findMetaContent(html, ["og:description", "twitter:description", "description"]);
    const image = normalizeMetaUrl(
      findMetaContent(html, ["og:image", "twitter:image"]),
      targetUrl
    );

    return NextResponse.json({
      success: true,
      data: {
        title: title || undefined,
        description: description || undefined,
        image: image || undefined,
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  }
}
