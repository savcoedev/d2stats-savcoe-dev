import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require auth
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { steam_ids } = await req.json();
    if (!Array.isArray(steam_ids) || steam_ids.length < 1 || steam_ids.length > 3) {
      return new Response(JSON.stringify({ error: "Provide 1-3 steam_ids" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Validate each id is a numeric string of reasonable length
    const validIds = steam_ids.every((s: unknown) => typeof s === "string" && /^[0-9]{6,20}$/.test(s));
    if (!validIds) {
      return new Response(JSON.stringify({ error: "Invalid steam_id format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results = await Promise.all(steam_ids.map(async (steamId: string) => {
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("id, persona_name, avatar_url, steam_id")
        .eq("steam_id", steamId)
        .single();

      if (!user) return { steam_id: steamId, found: false };

      const { data: stats } = await supabaseAdmin
        .from("player_match_stats")
        .select("map_pressure_score, combat_score, survival_rate")
        .eq("user_id", user.id)
        .order("start_time", { ascending: false })
        .limit(50);

      const s = stats ?? [];
      const avg = (key: string) => s.length ? s.reduce((a: number, m: any) => a + (m[key] ?? 0), 0) / s.length : 0;

      return {
        steam_id: steamId,
        found: true,
        persona_name: user.persona_name,
        avatar_url: user.avatar_url,
        matches_analyzed: s.length,
        avg_map_pressure: Math.round(avg("map_pressure_score") * 10) / 10,
        avg_combat: Math.round(avg("combat_score") * 10) / 10,
        avg_survival: Math.round(avg("survival_rate") * 10) / 10,
      };
    }));

    return new Response(JSON.stringify({ players: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("compare-players error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
