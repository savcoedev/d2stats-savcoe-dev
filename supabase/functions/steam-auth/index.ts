import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Step 1: Redirect user to Steam OpenID
  if (action === "login") {
    const redirectUri = url.searchParams.get("redirect_uri") || "";
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

      // Try to sign in first
      let { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Create account
        const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { steam_id: steamId, persona_name: player?.personaname },
        });

        if (signUpError) {
          return new Response(`Auth error: ${signUpError.message}`, { status: 500, headers: corsHeaders });
        }

        // Sign in the newly created user
        const { data: newSignIn } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });
        signInData = newSignIn;
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
      
      // Use redirect_uri passed through the flow, fallback to APP_ORIGIN env var
      const appOrigin = url.searchParams.get("redirect_uri") || Deno.env.get("APP_ORIGIN") || url.origin;
      const redirectUrl = `${appOrigin}/#access_token=${accessToken}&refresh_token=${refreshToken}&type=steam`;

      return Response.redirect(redirectUrl, 302);
    } catch (err) {
      console.error("Steam auth error:", err);
      return new Response(`Error: ${err.message}`, { status: 500, headers: corsHeaders });
    }
  }

  return new Response("Invalid action", { status: 400, headers: corsHeaders });
});
