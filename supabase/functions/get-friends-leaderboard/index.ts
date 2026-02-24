import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { steam_id } = await req.json();
    if (!steam_id) {
      return new Response(JSON.stringify({ error: "steam_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY");
    if (!STEAM_API_KEY) {
      return new Response(JSON.stringify({ error: "STEAM_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Steam friends list
    const friendsRes = await fetch(
      `https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${STEAM_API_KEY}&steamid=${steam_id}&relationship=friend`
    );

    if (!friendsRes.ok) {
      return new Response(JSON.stringify({ error: "Could not fetch friends list. Profile may be private.", code: "PRIVATE_PROFILE" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const friendsData = await friendsRes.json();
    const friendSteamIds: string[] = (friendsData?.friendslist?.friends ?? []).map((f: any) => f.steamid);

    if (friendSteamIds.length === 0) {
      return new Response(JSON.stringify({ friends: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find friends who are on the platform
    const { data: platformFriends } = await supabaseAdmin
      .from("users")
      .select("id, steam_id, persona_name, avatar_url")
      .in("steam_id", friendSteamIds);

    if (!platformFriends || platformFriends.length === 0) {
      return new Response(JSON.stringify({ friends: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get averaged scores for each friend
    const results = await Promise.all(platformFriends.map(async (friend) => {
      const { data: stats } = await supabaseAdmin
        .from("player_match_stats")
        .select("map_pressure_score, combat_score, survival_rate")
        .eq("user_id", friend.id)
        .order("start_time", { ascending: false })
        .limit(50);

      const s = stats ?? [];
      const avg = (key: string) => s.length ? s.reduce((a: number, m: any) => a + (m[key] ?? 0), 0) / s.length : 0;

      return {
        steam_id: friend.steam_id,
        persona_name: friend.persona_name ?? "Unknown",
        avatar_url: friend.avatar_url,
        avg_map_pressure: Math.round(avg("map_pressure_score") * 10) / 10,
        avg_combat: Math.round(avg("combat_score") * 10) / 10,
        avg_survival: Math.round(avg("survival_rate") * 10) / 10,
      };
    }));

    return new Response(JSON.stringify({ friends: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-friends-leaderboard error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
