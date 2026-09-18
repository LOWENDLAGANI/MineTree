import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClickPayload = {
  type: "page_view" | "link_click";
  username?: string;
  linkId?: string;
  referrer?: string;
};

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status: 400 });
}

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (per IP). Good enough to blunt abuse on a
// single instance; swap for Upstash/Redis if you scale horizontally.
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const buckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt < now) {
    // Opportunistic cleanup to keep the map from growing forever.
    if (buckets.size > 10_000) {
      for (const [key, b] of buckets) {
        if (b.resetAt < now) buckets.delete(key);
      }
    }
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Blocks cross-site beacons: analytics events must come from our own pages. */
function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // sendBeacon from same page typically sends origin; allow empty for non-CORS clients
  try {
    const host = req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "cross-origin blocked" }, { status: 403 });
  }
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: ClickPayload;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }

  const { type, username, linkId, referrer } = body ?? {};
  const cleanReferrer =
    typeof referrer === "string" && referrer.length > 0 ? referrer.slice(0, 512) : null;

  try {
    const admin = createAdminClient();

    if (type === "page_view") {
      if (!username || typeof username !== "string" || username.length > 24) {
        return badRequest("username required");
      }
      const { data: profile, error } = await admin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (error || !profile) return badRequest("unknown profile");

      const { error: insertError } = await admin.from("analytics_events").insert({
        profile_id: profile.id,
        event_type: "page_view",
        referrer: cleanReferrer,
      });
      if (insertError) throw insertError;

      return NextResponse.json({ ok: true });
    }

    if (type === "link_click") {
      if (!linkId || typeof linkId !== "string") {
        return badRequest("linkId required");
      }
      // Basic UUID shape check before hitting the RPC.
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkId);
      if (!isUuid) return badRequest("invalid linkId");

      const { error } = await admin.rpc("record_link_click", {
        p_link_id: linkId,
        p_referrer: cleanReferrer,
      });
      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    return badRequest("unknown event type");
  } catch (err) {
    console.error("[api/click]", err);
    // Analytics must never break the visitor experience.
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
