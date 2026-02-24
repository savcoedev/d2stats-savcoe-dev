import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Role weights for scoring (Pos 1-5)
const ROLE_WEIGHTS: Record<number, { mapPressure: Record<string, number>; combat: Record<string, number>; survival: Record<string, number> }> = {
  1: { // Hard Carry
    mapPressure: { last_hits: 0.35, gpm: 0.3, tower_damage: 0.2, denies: 0.15 },
    combat: { hero_damage: 0.4, kills: 0.35, assists: 0.25 },
    survival: { deaths_penalty: 0.6, healing: 0.4 },
  },
  2: { // Mid
    mapPressure: { last_hits: 0.25, gpm: 0.25, tower_damage: 0.25, denies: 0.25 },
    combat: { hero_damage: 0.35, kills: 0.35, assists: 0.3 },
    survival: { deaths_penalty: 0.5, healing: 0.5 },
  },
  3: { // Offlane
    mapPressure: { last_hits: 0.2, gpm: 0.2, tower_damage: 0.35, denies: 0.25 },
    combat: { hero_damage: 0.3, kills: 0.3, assists: 0.4 },
    survival: { deaths_penalty: 0.4, healing: 0.6 },
  },
  4: { // Soft Support
    mapPressure: { last_hits: 0.1, gpm: 0.15, tower_damage: 0.3, denies: 0.45 },
    combat: { hero_damage: 0.2, kills: 0.2, assists: 0.6 },
    survival: { deaths_penalty: 0.4, healing: 0.6 },
  },
  5: { // Hard Support
    mapPressure: { last_hits: 0.05, gpm: 0.1, tower_damage: 0.25, denies: 0.6 },
    combat: { hero_damage: 0.15, kills: 0.15, assists: 0.7 },
    survival: { deaths_penalty: 0.3, healing: 0.7 },
  },
};

// Baseline stats for normalization (approximate averages for a 40-min game)
const BASELINES = {
  last_hits: 250, denies: 20, gpm: 500, xpm: 550,
  tower_damage: 3000, hero_damage: 25000, hero_healing: 5000,
  kills: 10, deaths: 6, assists: 15,
};

const LANE_ROLE_NAMES: Record<number, string> = {
  1: "Safe Lane", 2: "Mid Lane", 3: "Off Lane", 4: "Jungle",
};

const GAME_MODE_NAMES: Record<number, string> = {
  1: "All Pick", 2: "Captain's Mode", 3: "Random Draft", 4: "Single Draft",
  5: "All Random", 12: "Least Played", 16: "Captain's Draft",
  22: "Ranked All Pick", 23: "Turbo",
};

function normalize(value: number, baseline: number, matchDuration: number): number {
  const normalized = (value / (matchDuration / 60)) * 40;
  return Math.min(100, (normalized / baseline) * 100);
}

function computeScores(stats: any, laneRole: number, duration: number) {
  const role = ROLE_WEIGHTS[laneRole] || ROLE_WEIGHTS[1];
  const dur = Math.max(duration, 600); // min 10 min

  const mapPressure = Math.min(100,
    normalize(stats.last_hits || 0, BASELINES.last_hits, dur) * role.mapPressure.last_hits +
    normalize(stats.gold_per_min || 0, BASELINES.gpm / 40 * (dur / 60), dur) * role.mapPressure.gpm +
    normalize(stats.tower_damage || 0, BASELINES.tower_damage, dur) * role.mapPressure.tower_damage +
    normalize(stats.denies || 0, BASELINES.denies, dur) * role.mapPressure.denies
  );

  const combat = Math.min(100,
    normalize(stats.hero_damage || 0, BASELINES.hero_damage, dur) * role.combat.hero_damage +
    normalize(stats.kills || 0, BASELINES.kills, dur) * role.combat.kills +
    normalize(stats.assists || 0, BASELINES.assists, dur) * role.combat.assists
  );

  const deathPenalty = Math.max(0, 100 - normalize(stats.deaths || 0, BASELINES.deaths, dur) * 1.5);
  const healingScore = normalize(stats.hero_healing || 0, BASELINES.hero_healing, dur);
  const survival = Math.min(100,
    deathPenalty * role.survival.deaths_penalty +
    healingScore * role.survival.healing
  );

  return {
    map_pressure_score: Math.round(mapPressure * 10) / 10,
    combat_score: Math.round(combat * 10) / 10,
    survival_rate: Math.round(survival * 10) / 10,
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
      const isWin = playerData.player_slot !== undefined
        ? (playerData.player_slot < 128) === (playerData.radiant_win ?? detail?.radiant_win)
        : null;

      const heroName = playerData.hero_id ? `Hero ${playerData.hero_id}` : null;
      const gameMode = match.game_mode ?? 0;
      const duration = match.duration ?? 0;
      const startTime = new Date((match.start_time ?? 0) * 1000).toISOString();

      // Insert match
      await supabaseAdmin.from("matches").upsert({
        user_id: userRecord.id,
        match_id: match.match_id,
        start_time: startTime,
        duration,
        game_mode: gameMode,
        game_mode_name: GAME_MODE_NAMES[gameMode] ?? `Mode ${gameMode}`,
        hero_id: playerData.hero_id ?? null,
        hero_name: heroName,
        is_win: isWin,
      }, { onConflict: "user_id,match_id" });

      // Compute scores
      const scores = computeScores(playerData, laneRole, duration);

      // Insert stats
      await supabaseAdmin.from("player_match_stats").upsert({
        user_id: userRecord.id,
        match_id: match.match_id,
        lane_role: laneRole,
        lane_role_name: LANE_ROLE_NAMES[laneRole] ?? `Role ${laneRole}`,
        is_win: isWin,
        game_mode: gameMode,
        game_mode_name: GAME_MODE_NAMES[gameMode] ?? `Mode ${gameMode}`,
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

      // Rate limiting: small delay between detail fetches
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
