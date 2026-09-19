import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-redirect";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // On Vercel the request URL can carry an internal host; redirect back to
  // the canonical public origin instead.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin = forwardedHost
    ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${forwardedHost}`
    : getSiteUrl();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // Open-redirect fix: only allow relative, internal paths.
  const next = safeInternalPath(searchParams.get("next"), "/dashboard");

  const supabase = await createClient();

  if (code) {
    // PKCE / magic-link style flow
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (tokenHash && type) {
    // Email template flow (signup confirmation, recovery)
    const allowed = [
      "signup",
      "recovery",
      "invite",
      "magiclink",
      "email_change",
    ] as const;
    const otpType = allowed.find((t) => t === type);
    if (otpType) {
      const { error } = await supabase.auth.verifyOtp({
        type: otpType,
        token_hash: tokenHash,
      });
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm`);
}
