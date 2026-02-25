import { motion } from "framer-motion";

type RoleGroup = "Core" | "Offlane" | "Support";
type ScoreType = "impact" | "pressure" | "survival";

interface TierBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  role?: RoleGroup;
  scoreType?: ScoreType;
}

type TierInfo = { letter: string; color: string; glow: boolean };

// Role-dependent thresholds for Impact Score
const IMPACT_THRESHOLDS: Record<RoleGroup, number[]> = {
  Core:    [30, 20, 12], // S >= 30, A >= 20, B >= 12, C < 12
  Offlane: [26, 18, 10],
  Support: [22, 14, 8],
};

function getTier(score: number, role?: RoleGroup, scoreType?: ScoreType): TierInfo {
  // For impact scores, use role-dependent thresholds
  if (scoreType === "impact" && role) {
    const [s, a, b] = IMPACT_THRESHOLDS[role];
    if (score >= s) return { letter: "S", color: "hsl(43 70% 55%)", glow: true };
    if (score >= a) return { letter: "A", color: "hsl(142 55% 50%)", glow: true };
    if (score >= b) return { letter: "B", color: "hsl(200 70% 55%)", glow: false };
    return { letter: "C", color: "hsl(0 40% 55%)", glow: false };
  }

  // For pressure & survival (or unknown), use a simple 4-tier scale
  if (score >= 80) return { letter: "S", color: "hsl(43 70% 55%)", glow: true };
  if (score >= 60) return { letter: "A", color: "hsl(142 55% 50%)", glow: true };
  if (score >= 40) return { letter: "B", color: "hsl(200 70% 55%)", glow: false };
  return { letter: "C", color: "hsl(0 40% 55%)", glow: false };
}

const sizeClasses = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

const TierBadge = ({ score, size = "md", role, scoreType }: TierBadgeProps) => {
  const tier = getTier(score, role, scoreType);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold border`}
      style={{
        background: `${tier.color.replace(")", " / 0.15)")}`,
        borderColor: `${tier.color.replace(")", " / 0.4)")}`,
        color: tier.color,
        boxShadow: tier.glow ? `0 0 12px ${tier.color.replace(")", " / 0.3)")}` : undefined,
      }}
    >
      {tier.letter}
    </motion.div>
  );
};

export default TierBadge;
