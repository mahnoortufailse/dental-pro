import { NextRequest, NextResponse } from "next/server";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaUrl = searchParams.get("url");
    const mediaType = searchParams.get("type") || "image";

    if (!mediaUrl) {
      console.error("[v0] Media proxy: No URL provided");
      return NextResponse.json({ error: "Media URL required" }, { status: 400 });
    }

    console.log("[v0] Proxying WhatsApp media with auth token:", { mediaType });

    // Fetch the media content from WhatsApp's temporary URL with access token
    // WhatsApp media URLs are temporary and require the access token in Authorization header
    const contentResponse = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    if (!contentResponse.ok) {
      console.error("[v0] Failed to fetch media from WhatsApp URL:", {
        status: contentResponse.status,
        statusText: contentResponse.statusText,
      });
      return NextResponse.json(
        { error: `Failed to fetch media: ${contentResponse.statusText}` },
        { status: contentResponse.status }
      );
    }

    const contentType = contentResponse.headers.get("content-type") || "application/octet-stream";
    const buffer = await contentResponse.arrayBuffer();

    console.log("[v0] Media proxy success:", { contentType, size: buffer.byteLength });

    // Return media with caching headers
    // WhatsApp media URLs expire in ~5 minutes, but we cache for reliability
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes (URL lifetime)
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (error) {
    console.error("[v0] Media proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
