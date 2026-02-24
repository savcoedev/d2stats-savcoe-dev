import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import TierBadge from "@/components/dashboard/TierBadge";

interface PlayerStats {
  steam_id: string;
  found: boolean;
  persona_name?: string;
  avatar_url?: string | null;
  matches_analyzed?: number;
  avg_map_pressure?: number;
  avg_combat?: number;
  avg_survival?: number;
}

interface PlayerBreakdownProps {
  players: PlayerStats[];
}

const StatRow = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{Math.round(value)}</span>
      <TierBadge score={value} size="sm" />
    </div>
  </div>
);

const PlayerBreakdown = ({ players }: PlayerBreakdownProps) => {
  const found = players.filter(p => p.found);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {found.map((p, i) => (
        <motion.div
          key={p.steam_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={p.avatar_url ?? undefined} />
              <AvatarFallback className="bg-secondary text-xs">{p.persona_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-semibold block">{p.persona_name}</span>
              <span className="text-xs text-muted-foreground">{p.matches_analyzed ?? 0} matches</span>
            </div>
          </div>
          <div className="space-y-3">
            <StatRow label="Map Pressure" value={p.avg_map_pressure ?? 0} />
            <StatRow label="Combat Score" value={p.avg_combat ?? 0} />
            <StatRow label="Survival Rate" value={p.avg_survival ?? 0} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PlayerBreakdown;
