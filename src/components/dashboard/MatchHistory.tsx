import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Sword, Shield, Heart } from "lucide-react";
import TierBadge from "./TierBadge";

interface MatchStat {
  id: string;
  match_id: number;
  hero_name: string | null;
  hero_id: number | null;
  lane_role_name: string | null;
  is_win: boolean | null;
  duration: number | null;
  map_pressure_score: number | null;
  combat_score: number | null;
  survival_rate: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  start_time: string | null;
  game_mode_name: string | null;
}

interface HeroImage {
  id: number;
  name: string;
  image_url: string;
}

interface MatchHistoryProps {
  matches: MatchStat[];
  heroImages?: Record<number, string>;
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const MatchHistory = ({ matches, heroImages = {} }: MatchHistoryProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-6 pb-3">
        <h3 className="text-base font-semibold">Match History</h3>
      </div>
      <div className="divide-y divide-border">
        {matches.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No matches found. Sync your data to get started.
          </div>
        )}
        {matches.map((match) => {
          const overallScore = ((match.map_pressure_score ?? 0) + (match.combat_score ?? 0) + (match.survival_rate ?? 0)) / 3;
          const heroImgUrl = match.hero_id ? heroImages[match.hero_id] : null;

          return (
            <div key={match.id}>
              <button
                onClick={() => setExpandedId(expandedId === match.id ? null : match.id)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors text-left"
              >
                <div className={`w-1 h-8 rounded-full ${match.is_win ? "bg-win" : "bg-loss"}`} />
                {heroImgUrl && (
                  <img
                    src={heroImgUrl}
                    alt={match.hero_name ?? "Hero"}
                    className="w-10 h-6 rounded object-cover"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{match.hero_name ?? "Unknown"}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {match.lane_role_name ?? "Unknown"}
                    </span>
                    {match.game_mode_name && (
                      <span className="text-xs text-muted-foreground">{match.game_mode_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{match.kills ?? 0}/{match.deaths ?? 0}/{match.assists ?? 0}</span>
                    {match.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(match.duration)}
                      </span>
                    )}
                  </div>
                </div>
                <TierBadge score={overallScore} size="md" />
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    expandedId === match.id ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {expandedId === match.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 grid grid-cols-3 gap-4">
                      <ScoreBar label="Map Pressure" value={match.map_pressure_score ?? 0} icon={Shield} color="hsl(200 70% 55%)" />
                      <ScoreBar label="Combat" value={match.combat_score ?? 0} icon={Sword} color="hsl(280 45% 55%)" />
                      <ScoreBar label="Survival" value={match.survival_rate ?? 0} icon={Heart} color="hsl(142 55% 45%)" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const ScoreBar = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="w-3 h-3" />
      {label}
    </div>
    <div className="h-2 rounded-full bg-secondary overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium">{Math.round(value)}</span>
      <TierBadge score={value} size="sm" />
    </div>
  </div>
);

export default MatchHistory;
