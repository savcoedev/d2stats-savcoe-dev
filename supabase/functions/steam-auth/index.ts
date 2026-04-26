import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Allowlist of permitted redirect origins. Anything outside this list is rejected
// to prevent open-redirect token theft attacks.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://id-preview--068b2a40-587e-4e39-9099-94c97c507c25.lovable.app",
  "https://d2stats-savcoe-dev.lovable.app",
  "https://d2.savcoe.dev",
  "http://localhost:5173",
  "http://localhost:8080",
];
const ALLOWED_ORIGINS = [
  ...DEFAULT_ALLOWED_ORIGINS,
  ...(Deno.env.get("APP_ORIGIN") ? [Deno.env.get("APP_ORIGIN")!] : []),
  ...(Deno.env.get("ALLOWED_REDIRECT_ORIGINS")?.split(",").map((s) => s.trim()).filter(Boolean) ?? []),
];

function isAllowedRedirect(uri: string | null): boolean {
  if (!uri) return false;
  try {
    const parsed = new URL(uri);
    const origin = `${parsed.protocol}//${parsed.host}`;
    return ALLOWED_ORIGINS.includes(origin);
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Step 1: Redirect user to Steam OpenID
  if (action === "login") {
    const redirectUri = url.searchParams.get("redirect_uri") || "";
    if (!isAllowedRedirect(redirectUri)) {
      return new Response("Invalid redirect_uri", { status: 400, headers: corsHeaders });
    }
    const returnUrl = `${SUPABASE_URL}/functions/v1/steam-auth?action=callback&redirect_uri=${encodeURIComponent(redirectUri)}`;
    const params = new URLSearchParams({
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.mode": "checkid_setup",
      "openid.return_to": returnUrl,
      "openid.realm": SUPABASE_URL,
      "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    });
    return Response.redirect(`https://steamcommunity.com/openid/login?${params}`, 302);
  }

  // Step 2: Handle callback from Steam
  if (action === "callback") {
    try {
      // Verify the OpenID response with Steam
      const verifyParams = new URLSearchParams(url.search);
      verifyParams.set("openid.mode", "check_authentication");
      
      const verifyRes = await fetch("https://steamcommunity.com/openid/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: verifyParams.toString(),
      });
      const verifyText = await verifyRes.text();

      if (!verifyText.includes("is_valid:true")) {
        return new Response("Steam verification failed", { status: 401, headers: corsHeaders });
      }

      // Extract Steam ID from claimed_id
      const claimedId = url.searchParams.get("openid.claimed_id") ?? "";
      const steamId = claimedId.split("/").pop();
      if (!steamId) {
        return new Response("No Steam ID found", { status: 400, headers: corsHeaders });
      }

      // Fetch Steam profile
      const profileRes = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
      );
      const profileData = await profileRes.json();
      const player = profileData.response?.players?.[0];

      // Create Supabase admin client
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Create or get auth user using email based on steam id
      const email = `steam_${steamId}@dota2analytics.local`;
      const password = `steam_${steamId}_${SUPABASE_SERVICE_ROLE_KEY.slice(0, 8)}`;

      // Step A: Try to sign in first
      let { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Step B: Check if user already exists
        try {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = listData?.users?.find((u) => u.email === email);

          if (existingUser) {
            // Step C: User exists but password changed — update password and retry
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
            const { data: retrySignIn, error: retryError } = await supabaseAdmin.auth.signInWithPassword({
              email,
              password,
            });
            if (retryError) {
              return new Response(`Auth retry error: ${retryError.message}`, { status: 500, headers: corsHeaders });
            }
            signInData = retrySignIn;
          } else {
            // Step D: User truly doesn't exist — create them
            const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { steam_id: steamId, persona_name: player?.personaname },
            });
            if (signUpError) {
              return new Response(`Auth create error: ${signUpError.message}`, { status: 500, headers: corsHeaders });
            }
            const { data: newSignIn } = await supabaseAdmin.auth.signInWithPassword({
              email,
              password,
            });
            signInData = newSignIn;
          }
        } catch (adminErr) {
          console.error("Admin API error:", adminErr);
          return new Response(`Admin API error: ${adminErr.message}`, { status: 500, headers: corsHeaders });
        }
      }

      const userId = signInData?.user?.id;
      if (!userId) {
        return new Response("Failed to authenticate", { status: 500, headers: corsHeaders });
      }

      // Upsert profile in users table
      await supabaseAdmin.from("users").upsert(
        {
          auth_uid: userId,
          steam_id: steamId,
          persona_name: player?.personaname ?? null,
          avatar_url: player?.avatarfull ?? null,
        },
        { onConflict: "auth_uid" }
      );

      // Redirect to app with session token
      const accessToken = signInData?.session?.access_token;
      const refreshToken = signInData?.session?.refresh_token;
      
      // Validate redirect_uri against allowlist before issuing tokens
      const requestedRedirect = url.searchParams.get("redirect_uri");
      if (!isAllowedRedirect(requestedRedirect)) {
        return new Response("Invalid redirect_uri", { status: 400, headers: corsHeaders });
      }
      const appOrigin = requestedRedirect!;
      const redirectUrl = `${appOrigin}/#access_token=${accessToken}&refresh_token=${refreshToken}&type=steam`;

      return Response.redirect(redirectUrl, 302);
    } catch (err) {
      console.error("Steam auth error:", err);
      return new Response(`Error: ${err.message}`, { status: 500, headers: corsHeaders });
    }
  }

  return new Response("Invalid action", { status: 400, headers: corsHeaders });
});
