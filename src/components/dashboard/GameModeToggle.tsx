import { motion } from "framer-motion";

type GameMode = "ranked" | "normal" | "turbo";

interface GameModeToggleProps {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}

const modes: { value: GameMode; label: string }[] = [
  { value: "ranked", label: "Ranked" },
  { value: "normal", label: "Normal" },
  { value: "turbo", label: "Turbo" },
];

const GameModeToggle = ({ mode, onChange }: GameModeToggleProps) => {
  return (
    <div className="glass-card inline-flex p-1 gap-1">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        >
          {mode === m.value && (
            <motion.div
              layoutId="activeMode"
              className="absolute inset-0 bg-primary/15 border border-primary/30 rounded-lg"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className={`relative z-10 ${mode === m.value ? "text-primary" : "text-muted-foreground"}`}>
            {m.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default GameModeToggle;
