import { motion } from "framer-motion";

interface TierBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

type TierInfo = { letter: string; color: string; glow: boolean };

const getTier = (score: number): TierInfo => {
  if (score >= 90) return { letter: "S", color: "hsl(43 70% 55%)", glow: true };
  if (score >= 80) return { letter: "A", color: "hsl(142 55% 50%)", glow: true };
  if (score >= 70) return { letter: "B", color: "hsl(200 70% 55%)", glow: false };
  if (score >= 60) return { letter: "C", color: "hsl(175 50% 45%)", glow: false };
  if (score >= 50) return { letter: "D", color: "hsl(30 65% 55%)", glow: false };
  return { letter: "F", color: "hsl(0 50% 50%)", glow: false };
};

const sizeClasses = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

const TierBadge = ({ score, size = "md" }: TierBadgeProps) => {
  const tier = getTier(score);

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
