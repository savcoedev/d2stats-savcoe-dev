import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import TierBadge from "./TierBadge";

interface ScoreCardProps {
  title: string;
  score: number;
  icon: LucideIcon;
  color: string;
  delay?: number;
  role?: "Core" | "Offlane" | "Support";
  scoreType?: "impact" | "pressure" | "survival";
}

const ScoreCard = ({ title, score, icon: Icon, color, delay = 0, role, scoreType }: ScoreCardProps) => {
  const circumference = 2 * Math.PI * 40;
  const maxVal = scoreType === "impact" ? 50 : 100;
  const offset = circumference - (Math.min(score, maxVal) / maxVal) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card-hover p-6 flex flex-col items-center gap-4"
    >
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: delay + 0.3, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 }}
          >
            {score.toFixed(1)}
          </motion.span>
        </div>
      </div>
      <TierBadge score={score} size="lg" role={role} scoreType={scoreType} />
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
    </motion.div>
  );
};

export default ScoreCard;
