import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Sword, Shield, Heart, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  last_hits: number | null;
  tower_damage: number | null;
  start_time: string | null;
  game_mode_name: string | null;
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

const formatMatchDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return Math.abs(differenceInDays(now, d)) > 365
    ? format(d, "MMM d, yyyy")
    : format(d, "MMM d");
};

const MatchHistory = ({ matches, heroImages = {} }: MatchHistoryProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <TooltipProvider delayDuration={150}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card glow-border overflow-hidden"
      >
        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold tracking-tight">
              <span className="text-gradient">Match History</span>
            </h3>
            {matches.length > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">
                {matches.length}
              </span>
            )}
          </div>
        </div>
        <div className="divide-y divide-border/60">
          {matches.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No matches found. Sync your data to get started.
            </div>
          )}
          {matches.map((match) => {
            const overallScore =
              ((match.map_pressure_score ?? 0) +
                (match.combat_score ?? 0) +
                (match.survival_rate ?? 0)) / 3;
            const heroImgUrl = match.hero_id ? heroImages[match.hero_id] : null;
            const isExpanded = expandedId === match.id;
            const isWin = !!match.is_win;
            const accentColor = isWin ? "hsl(var(--win))" : "hsl(var(--loss))";

            return (
              <div key={match.id} className="relative group">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : match.id)}
                  className="relative w-full px-6 py-4 flex items-center gap-4 text-left transition-colors hover:bg-[radial-gradient(ellipse_at_top_left,hsl(var(--glow-primary)/0.08),transparent_60%)]"
                >
                  {/* Win/loss vertical accent rail with gradient + glow */}
                  <div
                    className="w-[3px] h-10 rounded-full transition-all duration-300"
                    style={{
                      background: isWin
                        ? "linear-gradient(180deg, hsl(142 70% 55%), hsl(180 65% 50%))"
                        : "linear-gradient(180deg, hsl(350 75% 60%), hsl(20 75% 55%))",
                      boxShadow: isExpanded
                        ? `0 0 12px ${accentColor.replace(")", " / 0.6)")}`
                        : `0 0 4px ${accentColor.replace(")", " / 0.25)")}`,
                    }}
                  />

                  {heroImgUrl && (
                    <div
                      className="rounded-lg overflow-hidden ring-1 transition-transform duration-300 group-hover:scale-105"
                      style={{ boxShadow: `0 0 0 1px ${accentColor.replace(")", " / 0.45)")}` }}
                    >
                      <img
                        src={heroImgUrl}
                        alt={match.hero_name ?? "Hero"}
                        className="w-12 h-7 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {match.hero_name ?? "Unknown"}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground border border-border/60">
                        {match.lane_role_name ?? "Unknown"}
                      </span>
                      {match.game_mode_name && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                          {match.game_mode_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono tabular-nums">
                        {match.kills ?? 0}/{match.deaths ?? 0}/{match.assists ?? 0}
                      </span>
                      {match.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(match.duration)}
                        </span>
                      )}
                      {match.start_time && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatMatchDate(match.start_time)}
                        </span>
                      )}
                    </div>
                  </div>

                  <TierBadge score={overallScore} size="md" />
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                      isExpanded ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                      style={{
                        boxShadow: "inset 0 8px 16px -8px hsl(var(--background) / 0.8)",
                      }}
                    >
                      <div className="px-6 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <ScoreBar
                          label="Map Pressure"
                          value={match.map_pressure_score ?? 0}
                          icon={Shield}
                          color="hsl(200 70% 55%)"
                          tooltipTitle="Map Pressure"
                          formula="(Tower Damage + Last Hits × mode_scalar) ÷ duration_minutes"
                          breakdown={[
                            { k: "Tower Damage", v: match.tower_damage ?? 0 },
                            { k: "Last Hits", v: match.last_hits ?? 0 },
                            { k: "Duration (min)", v: match.duration ? +(match.duration / 60).toFixed(1) : 0 },
                            { k: "Score", v: (match.map_pressure_score ?? 0).toFixed(1), highlight: true },
                          ]}
                        />
                        <ScoreBar
                          label="Impact"
                          value={match.combat_score ?? 0}
                          icon={Sword}
                          color="hsl(280 45% 55%)"
                          tooltipTitle="Impact Score"
                          formula="max(0, K×2.5 + A×1.5 + TD÷500 − D×2.0) × mode_scalar"
                          note="Turbo mode applies a 0.65 scalar"
                          breakdown={[
                            { k: "Kills (K)", v: match.kills ?? 0 },
                            { k: "Assists (A)", v: match.assists ?? 0 },
                            { k: "Deaths (D)", v: match.deaths ?? 0 },
                            { k: "Tower Damage (TD)", v: match.tower_damage ?? 0 },
                            { k: "Score", v: (match.combat_score ?? 0).toFixed(1), highlight: true },
                          ]}
                        />
                        <ScoreBar
                          label="Survival"
                          value={match.survival_rate ?? 0}
                          icon={Heart}
                          color="hsl(142 55% 45%)"
                          tooltipTitle="Survival Consistency"
                          formula="((duration_sec − D × 35) ÷ duration_sec) × 100"
                          breakdown={[
                            { k: "Duration (s)", v: match.duration ?? 0 },
                            { k: "Deaths (D)", v: match.deaths ?? 0 },
                            { k: "Lost Time", v: `${(match.deaths ?? 0) * 35}s` },
                            { k: "Score", v: `${(match.survival_rate ?? 0).toFixed(1)}%`, highlight: true },
                          ]}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

interface ScoreBarProps {
  label: string;
  value: number;
  icon: any;
  color: string;
  tooltipTitle: string;
  formula: string;
  breakdown: { k: string; v: string | number; highlight?: boolean }[];
  note?: string;
}

const ScoreBar = ({ label, value, icon: Icon, color, tooltipTitle, formula, breakdown, note }: ScoreBarProps) => {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className="flex flex-col gap-1.5 outline-none rounded-md focus-visible:ring-2 focus-visible:ring-primary/50 cursor-help"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="w-3 h-3" style={{ color }} />
            <span className="uppercase tracking-wider font-medium">{label}</span>
          </div>

          {/* Bar track with inset shadow */}
          <div
            className="relative h-2.5 rounded-full bg-secondary/60 overflow-hidden"
            style={{ boxShadow: "inset 0 1px 2px hsl(var(--background) / 0.6)" }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${color.replace(")", " / 0.6)")}, ${color})`,
                boxShadow: `0 0 8px ${color.replace(")", " / 0.5)")}`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${clamped}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              {/* Shimmer sweep */}
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.18) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.4s linear infinite",
                }}
              />
            </motion.div>

            {/* End-cap glowing dot */}
            {clamped > 2 && (
              <motion.div
                className="absolute top-1/2 w-1.5 h-1.5 rounded-full -translate-y-1/2 -translate-x-1/2"
                style={{
                  background: color,
                  boxShadow: `0 0 8px ${color}, 0 0 14px ${color.replace(")", " / 0.8)")}`,
                  left: `${clamped}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono tabular-nums" style={{ color }}>
              {value.toFixed(1)}
            </span>
            <TierBadge score={value} size="sm" />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="glass-card border-glass-border/60 max-w-xs p-0 overflow-hidden"
      >
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Icon className="w-3.5 h-3.5" style={{ color }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
              {tooltipTitle}
            </span>
          </div>
          <div className="text-[11px] leading-relaxed text-muted-foreground font-mono bg-secondary/40 rounded px-2 py-1.5 border border-border/40">
            {formula}
          </div>
          <div className="space-y-1 pt-1">
            {breakdown.map((row) => (
              <div key={row.k} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-muted-foreground">{row.k}</span>
                <span
                  className={`font-mono tabular-nums ${row.highlight ? "font-bold" : ""}`}
                  style={row.highlight ? { color } : undefined}
                >
                  {row.v}
                </span>
              </div>
            ))}
          </div>
          {note && (
            <div className="text-[10px] text-muted-foreground/80 italic pt-1 border-t border-border/40">
              {note}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default MatchHistory;
