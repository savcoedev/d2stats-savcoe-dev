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
  return "Support";
}

// --- Scoring Formulas ---
// Map Pressure scaled ×100 for parity with Survival tier thresholds.
function computeScores(stats: any, gameMode: number, durationSec: number) {
  const modeScalar = gameMode === 23 ? 0.65 : 1.0;
  const durationMin = Math.max(durationSec / 60, 1);

  const K = stats.kills ?? 0;
  const A = stats.assists ?? 0;
  const D = stats.deaths ?? 0;
  const TD = stats.tower_damage ?? 0;
  const LH = stats.last_hits ?? 0;

  // Impact: I = max(0, (K*2.5)+(A*1.5)+(TD/500)-(D*2.0)) * mode_scalar
  const impactScore = Math.max(0, (K * 2.5) + (A * 1.5) + (TD / 500) - (D * 2.0)) * modeScalar;

  // Map Pressure (×100 for parity): P = (TD + LH*scalar) / T_minutes
  const mapPressure = (TD + (LH * modeScalar)) / durationMin;

  // Survival: S = ((T_match - D*35) / T_match) * 100
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

    const steamId64 = BigInt(steam_id);
    const accountId = Number(steamId64 - BigInt("76561197960265728"));

    // Fetch latest 25 from OpenDota
    const matchesRes = await fetch(`https://api.opendota.com/api/players/${accountId}/matches?limit=25`);
    if (!matchesRes.ok) {
      return new Response(JSON.stringify({ error: "OpenDota API error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const recentMatches = await matchesRes.json();

    // Existing matches lookup (by match_id) — used to skip detail fetch for known matches
    const recentIds = recentMatches.map((m: any) => m.match_id);
    const { data: existingStats } = await supabaseAdmin
      .from("player_match_stats")
      .select("match_id, kills, deaths, assists, tower_damage, last_hits, hero_damage, hero_healing, gpm, xpm, denies, lane_role, hero_id, duration, start_time, game_mode, is_win")
      .eq("user_id", userRecord.id)
      .in("match_id", recentIds);

    const existingByMatchId = new Map<number, any>();
    for (const s of existingStats ?? []) {
      existingByMatchId.set(Number(s.match_id), s);
    }

    let newCount = 0;
    let recomputedCount = 0;

    for (const match of recentMatches) {
      const existing = existingByMatchId.get(Number(match.match_id));
      let playerData: any;
      let detail: any = null;

      if (existing) {
        // Reuse stored raw stats — no detail fetch needed; just recompute scores.
        playerData = { ...match, ...existing };
      } else {
        // New match — fetch detail (skips gracefully if unparsed)
        try {
          const detailRes = await fetch(`https://api.opendota.com/api/matches/${match.match_id}`);
          if (detailRes.ok) detail = await detailRes.json();
        } catch { /* unparsed */ }

        playerData = match;
        if (detail?.players) {
          const found = detail.players.find((p: any) => p.account_id === accountId);
          if (found) playerData = { ...match, ...found };
        }
      }

      const laneRole = playerData.lane_role || 1;
      const roleGroup = getRoleGroup(laneRole);
      const isWin = playerData.player_slot !== undefined
        ? (playerData.player_slot < 128) === (playerData.radiant_win ?? detail?.radiant_win)
        : (playerData.is_win ?? null);

      const heroName = playerData.hero_id ? (heroMap[playerData.hero_id] ?? `Hero ${playerData.hero_id}`) : null;
      const gameMode = match.game_mode ?? playerData.game_mode ?? 0;
      const duration = match.duration ?? playerData.duration ?? 0;
      const startTime = playerData.start_time
        ? (typeof playerData.start_time === "string" ? playerData.start_time : new Date((match.start_time ?? 0) * 1000).toISOString())
        : new Date((match.start_time ?? 0) * 1000).toISOString();
      const gameModeName = getGameModeName(gameMode);

      // Upsert match row
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

      const scores = computeScores(playerData, gameMode, duration);

      // Upsert stats
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
        gpm: playerData.gold_per_min ?? playerData.gpm ?? 0,
        xpm: playerData.xp_per_min ?? playerData.xpm ?? 0,
        last_hits: playerData.last_hits ?? 0,
        denies: playerData.denies ?? 0,
        tower_damage: playerData.tower_damage ?? 0,
        hero_damage: playerData.hero_damage ?? 0,
        hero_healing: playerData.hero_healing ?? 0,
        ...scores,
      }, { onConflict: "user_id,match_id" });

      if (existing) recomputedCount++;
      else newCount++;

      // Rate limit only for fresh detail fetches
      if (!existing && newCount % 5 === 0) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Trim: keep only the latest 25 matches per user
    const keepIds = recentIds;
    if (keepIds.length > 0) {
      await supabaseAdmin
        .from("player_match_stats")
        .delete()
        .eq("user_id", userRecord.id)
        .not("match_id", "in", `(${keepIds.join(",")})`);
      await supabaseAdmin
        .from("matches")
        .delete()
        .eq("user_id", userRecord.id)
        .not("match_id", "in", `(${keepIds.join(",")})`);
    }

    await supabaseAdmin
      .from("users")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", userRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        new_matches: newCount,
        recomputed: recomputedCount,
        total: newCount + recomputedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
