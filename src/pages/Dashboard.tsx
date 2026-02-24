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
import CompareTab from "@/components/compare/CompareTab";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import StatusBanner from "@/components/ui/StatusBanner";

type GameMode = "ranked" | "normal" | "turbo";
type DashboardTab = "overview" | "compare";

const gameModeMap: Record<GameMode, number[]> = {
  ranked: [22],
  normal: [1, 2, 3, 4, 5, 12, 16],
  turbo: [23],
};

const Dashboard = () => {
  const { profile } = useAuth();
  const [mode, setMode] = useState<GameMode>("ranked");
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [stats, setStats] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [heroImages, setHeroImages] = useState<Record<number, string>>({});
  const [syncError, setSyncError] = useState<string | null>(null);

  // Load hero images
  useEffect(() => {
    supabase.from("heroes").select("id, image_url").then(({ data }) => {
      if (data) {
        const map: Record<number, string> = {};
        data.forEach((h: any) => { map[h.id] = h.image_url; });
        setHeroImages(map);
      }
    });
  }, []);

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

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Fetch friends leaderboard
  useEffect(() => {
    if (!profile?.steam_id) return;
    setFriendsLoading(true);
    supabase.functions.invoke("get-friends-leaderboard", {
      body: { steam_id: profile.steam_id },
    }).then(({ data }) => {
      if (data?.friends) setFriends(data.friends);
      setFriendsLoading(false);
    }).catch(() => setFriendsLoading(false));
  }, [profile?.steam_id]);

  const handleSync = async () => {
    if (!profile) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const { data, error } = await supabase.functions.invoke("sync-matches", {
        body: { steam_id: profile.steam_id },
      });
      if (error) throw error;
      await fetchStats();
    } catch (e: any) {
      const msg = e?.message ?? "Sync failed";
      if (msg.includes("429") || msg.includes("rate")) {
        setSyncError("API rate limit reached. Please wait a moment and try again.");
      } else {
        setSyncError(msg);
      }
    } finally {
      setSyncing(false);
    }
  };

  // Compute averages
  const avgMapPressure = stats.length ? stats.reduce((s, m) => s + (m.map_pressure_score ?? 0), 0) / stats.length : 0;
  const avgCombat = stats.length ? stats.reduce((s, m) => s + (m.combat_score ?? 0), 0) / stats.length : 0;
  const avgSurvival = stats.length ? stats.reduce((s, m) => s + (m.survival_rate ?? 0), 0) / stats.length : 0;

  // Chart data
  const chartData = stats.slice(0, 20).reverse().map((m, i) => ({
    match: i + 1,
    mapPressure: m.map_pressure_score ?? 0,
    combat: m.combat_score ?? 0,
    survival: m.survival_rate ?? 0,
  }));

  return (
    <div className="min-h-screen gradient-bg">
      <OnboardingModal />
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <ProfileHeader onSync={handleSync} syncing={syncing} />

        <StatusBanner
          variant="rate-limit"
          message={syncError ?? ""}
          visible={!!syncError}
          onDismiss={() => setSyncError(null)}
        />

        {/* Tab Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="glass-card inline-flex p-1 gap-1">
            {(["overview", "compare"] as DashboardTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              >
                {tab === t && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/15 border border-primary/30 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className={`relative z-10 capitalize ${tab === t ? "text-primary" : "text-muted-foreground"}`}>
                  {t}
                </span>
              </button>
            ))}
          </div>
          {tab === "overview" && <GameModeToggle mode={mode} onChange={setMode} />}
        </div>

        {tab === "overview" ? (
          <>
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

            {chartData.length > 1 && <PerformanceChart data={chartData} />}

            <MatchHistory matches={stats} heroImages={heroImages} />
          </>
        ) : (
          <CompareTab />
        )}
      </div>

      <FriendsLeaderboard friends={friends} loading={friendsLoading} />
    </div>
  );
};

export default Dashboard;
