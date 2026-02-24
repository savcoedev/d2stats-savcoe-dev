import { AlertTriangle, Info, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type BannerVariant = "rate-limit" | "private-profile" | "unparsed";

interface StatusBannerProps {
  variant: BannerVariant;
  message: string;
  visible: boolean;
  onDismiss?: () => void;
}

const variantConfig: Record<BannerVariant, { icon: typeof AlertTriangle; bgClass: string; borderClass: string; textClass: string }> = {
  "rate-limit": {
    icon: AlertTriangle,
    bgClass: "bg-[hsl(40_80%_50%/0.1)]",
    borderClass: "border-[hsl(40_80%_50%/0.3)]",
    textClass: "text-[hsl(40_80%_55%)]",
  },
  "private-profile": {
    icon: Info,
    bgClass: "bg-[hsl(200_70%_55%/0.1)]",
    borderClass: "border-[hsl(200_70%_55%/0.3)]",
    textClass: "text-primary",
  },
  "unparsed": {
    icon: Eye,
    bgClass: "bg-muted/50",
    borderClass: "border-border",
    textClass: "text-muted-foreground",
  },
};

const StatusBanner = ({ variant, message, visible, onDismiss }: StatusBannerProps) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={`${config.bgClass} ${config.borderClass} border rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm overflow-hidden`}
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${config.textClass}`} />
          <span className={`text-sm ${config.textClass} flex-1`}>{message}</span>
          {onDismiss && (
            <button onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Dismiss
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusBanner;
