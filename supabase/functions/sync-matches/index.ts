import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// --- Game Mode Classification ---
function getGameModeName(gameMode: number): string {
  if (gameMode === 22) return "Ranked";
  if (gameMode === 23) return "Turbo";
  return "Normal";
}

// --- Role Group Mapping ---
function getRoleGroup(laneRole: number): string {
  if (laneRole === 1 || laneRole === 2) return "Core";
  if (laneRole === 3) return "Offlane";
  return "Support"; // 4, 5, or unknown
}

// --- New Scoring Formulas (from PDF) ---
function computeScores(stats: any, gameMode: number, durationSec: number) {
  const modeScalar = gameMode === 23 ? 0.65 : 1.0;
  const durationMin = Math.max(durationSec / 60, 1); // avoid division by zero

  const K = stats.kills ?? 0;
  const A = stats.assists ?? 0;
  const D = stats.deaths ?? 0;
  const TD = stats.tower_damage ?? 0;
  const LH = stats.last_hits ?? 0;

  // Impact Score: I = max(0, (K*2.5)+(A*1.5)+(TD/500)-(D*2.0)) * mode_scalar
  const impactScore = Math.max(0, (K * 2.5) + (A * 1.5) + (TD / 500) - (D * 2.0)) * modeScalar;

  // Map Pressure: P = (TD + (LH * mode_scalar)) / (100 * T_minutes)
  const mapPressure = (TD + (LH * modeScalar)) / (100 * durationMin);

  // Survival Consistency: S = ((T_match - (D*35)) / T_match) * 100
  const tMatch = Math.max(durationSec, 1);
  const survivalConsistency = Math.max(0, ((tMatch - (D * 35)) / tMatch) * 100);

  return {
    combat_score: Math.round(impactScore * 100) / 100,
    map_pressure_score: Math.round(mapPressure * 100) / 100,
    survival_rate: Math.round(survivalConsistency * 100) / 100,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { steam_id } = await req.json();
    if (!steam_id) {
      return new Response(JSON.stringify({ error: "steam_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user record
    const { data: userRecord } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("steam_id", steam_id)
      .single();

    if (!userRecord) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load hero dictionary — auto-sync if empty
    let { data: heroRows } = await supabaseAdmin.from("heroes").select("id, localized_name");
    if (!heroRows || heroRows.length === 0) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/sync-heroes`, {
          method: "POST",
          headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
          body: "{}",
        });
        const res = await supabaseAdmin.from("heroes").select("id, localized_name");
        heroRows = res.data ?? [];
      } catch { /* proceed without heroes */ }
    }
    const heroMap: Record<number, string> = {};
    for (const h of heroRows ?? []) {
      heroMap[h.id] = h.localized_name;
    }

    // Convert Steam ID to account ID (32-bit)
    const steamId64 = BigInt(steam_id);
    const accountId = Number(steamId64 - BigInt("76561197960265728"));

    // Fetch recent matches from OpenDota
    const matchesRes = await fetch(`https://api.opendota.com/api/players/${accountId}/matches?limit=50`);
    if (!matchesRes.ok) {
      return new Response(JSON.stringify({ error: "OpenDota API error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const recentMatches = await matchesRes.json();

    let processedCount = 0;

    for (const match of recentMatches) {
      // Check if we already have this match
      const { data: existing } = await supabaseAdmin
        .from("matches")
        .select("id")
        .eq("user_id", userRecord.id)
        .eq("match_id", match.match_id)
        .maybeSingle();

      if (existing) continue;

      // Fetch detailed match data
      let detail: any = null;
      try {
        const detailRes = await fetch(`https://api.opendota.com/api/matches/${match.match_id}`);
        if (detailRes.ok) {
          detail = await detailRes.json();
        }
      } catch { /* skip unparsed matches */ }

      // Find our player in the match detail
      let playerData = match;
      if (detail?.players) {
        const found = detail.players.find((p: any) => p.account_id === accountId);
        if (found) playerData = { ...match, ...found };
      }

      const laneRole = playerData.lane_role || 1;
      const roleGroup = getRoleGroup(laneRole);
      const isWin = playerData.player_slot !== undefined
        ? (playerData.player_slot < 128) === (playerData.radiant_win ?? detail?.radiant_win)
        : null;

      const heroName = playerData.hero_id ? (heroMap[playerData.hero_id] ?? `Hero ${playerData.hero_id}`) : null;
      const gameMode = match.game_mode ?? 0;
      const duration = match.duration ?? 0;
      const startTime = new Date((match.start_time ?? 0) * 1000).toISOString();
      const gameModeName = getGameModeName(gameMode);

      // Insert match
      await supabaseAdmin.from("matches").upsert({
        user_id: userRecord.id,
        match_id: match.match_id,
        start_time: startTime,
        duration,
        game_mode: gameMode,
        game_mode_name: gameModeName,
        hero_id: playerData.hero_id ?? null,
        hero_name: heroName,
        is_win: isWin,
      }, { onConflict: "user_id,match_id" });

      // Compute scores with new formulas
      const scores = computeScores(playerData, gameMode, duration);

      // Insert stats
      await supabaseAdmin.from("player_match_stats").upsert({
        user_id: userRecord.id,
        match_id: match.match_id,
        lane_role: laneRole,
        lane_role_name: roleGroup,
        is_win: isWin,
        game_mode: gameMode,
        game_mode_name: gameModeName,
        hero_id: playerData.hero_id ?? null,
        hero_name: heroName,
        duration,
        start_time: startTime,
        kills: playerData.kills ?? 0,
        deaths: playerData.deaths ?? 0,
        assists: playerData.assists ?? 0,
        gpm: playerData.gold_per_min ?? 0,
        xpm: playerData.xp_per_min ?? 0,
        last_hits: playerData.last_hits ?? 0,
        denies: playerData.denies ?? 0,
        tower_damage: playerData.tower_damage ?? 0,
        hero_damage: playerData.hero_damage ?? 0,
        hero_healing: playerData.hero_healing ?? 0,
        ...scores,
      }, { onConflict: "user_id,match_id" });

      processedCount++;

      // Rate limiting
      if (processedCount % 5 === 0) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Update last_synced_at
    await supabaseAdmin
      .from("users")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", userRecord.id);

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
