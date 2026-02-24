import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Sword, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import GameModeToggle from "@/components/dashboard/GameModeToggle";
import ScoreCard from "@/components/dashboard/ScoreCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import MatchHistory from "@/components/dashboard/MatchHistory";
import FriendsLeaderboard from "@/components/dashboard/FriendsLeaderboard";

type GameMode = "ranked" | "normal" | "turbo";

const gameModeMap: Record<GameMode, number[]> = {
  ranked: [22],     // All Pick Ranked
  normal: [1, 2, 3, 4, 5, 12, 16], // Various unranked modes
  turbo: [23],
};

const Dashboard = () => {
  const { profile } = useAuth();
  const [mode, setMode] = useState<GameMode>("ranked");
  const [stats, setStats] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!profile) return;
    const modes = gameModeMap[mode];
    const { data } = await supabase
      .from("player_match_stats")
      .select("*")
      .eq("user_id", profile.id)
      .in("game_mode", modes)
      .order("start_time", { ascending: false })
      .limit(50);
    setStats(data ?? []);
  }, [profile, mode]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSync = async () => {
    if (!profile) return;
    setSyncing(true);
    try {
      await supabase.functions.invoke("sync-matches", {
        body: { steam_id: profile.steam_id },
      });
      await fetchStats();
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setSyncing(false);
    }
  };

  // Compute averages
  const avgMapPressure = stats.length ? stats.reduce((s, m) => s + (m.map_pressure_score ?? 0), 0) / stats.length : 0;
  const avgCombat = stats.length ? stats.reduce((s, m) => s + (m.combat_score ?? 0), 0) / stats.length : 0;
  const avgSurvival = stats.length ? stats.reduce((s, m) => s + (m.survival_rate ?? 0), 0) / stats.length : 0;

  // Chart data (last 20 reversed for chronological order)
  const chartData = stats.slice(0, 20).reverse().map((m, i) => ({
    match: i + 1,
    mapPressure: m.map_pressure_score ?? 0,
    combat: m.combat_score ?? 0,
    survival: m.survival_rate ?? 0,
  }));

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <ProfileHeader onSync={handleSync} syncing={syncing} />

        <div className="flex items-center justify-between flex-wrap gap-4">
          <GameModeToggle mode={mode} onChange={setMode} />
        </div>

        {/* Score Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ScoreCard title="Map Pressure" score={avgMapPressure} icon={Shield} color="hsl(200 70% 55%)" delay={0} />
          <ScoreCard title="Combat Score" score={avgCombat} icon={Sword} color="hsl(280 45% 55%)" delay={0.1} />
          <ScoreCard title="Survival Rate" score={avgSurvival} icon={Heart} color="hsl(142 55% 45%)" delay={0.2} />
        </motion.div>

        {/* Performance Chart */}
        {chartData.length > 1 && <PerformanceChart data={chartData} />}

        {/* Match History */}
        <MatchHistory matches={stats} />
      </div>

      {/* Friends Leaderboard */}
      <FriendsLeaderboard friends={friends} loading={friendsLoading} />
    </div>
  );
};

export default Dashboard;
