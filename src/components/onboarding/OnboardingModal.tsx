import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sword, Heart, Award, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "d2stats_onboarding_done";

const steps = [
  {
    icon: Shield,
    title: "Map Pressure",
    desc: "Measures your tower damage, last hits, denies, and GPM — weighted by your assigned role. A Pos 5 support isn't penalized for lower farm.",
    color: "hsl(200 70% 55%)",
  },
  {
    icon: Sword,
    title: "Combat Score",
    desc: "Tracks hero damage, kills, and assists with role-specific weights. Supports get credit for fight participation, carries for damage output.",
    color: "hsl(280 45% 55%)",
  },
  {
    icon: Heart,
    title: "Survival Rate",
    desc: "Combines death penalty with healing output. Dying less matters more for carries; healing output matters more for supports.",
    color: "hsl(142 55% 45%)",
  },
  {
    icon: Award,
    title: "Tier Badges",
    desc: "Your scores translate to gamified grades: S (≥90), A (≥80), B (≥70), C (≥60), D (≥50), F (<50). Aim for that gold S-Tier badge!",
    color: "hsl(43 70% 55%)",
  },
];

const OnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setOpen(true);
    }
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else close();
  };

  if (!open) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/60 backdrop-blur-md"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.3 }}
          className="glass-card max-w-md w-full p-8 relative"
        >
          <button onClick={close} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${current.color.replace(")", " / 0.15)")}` }}
            >
              <Icon className="w-7 h-7" style={{ color: current.color }} />
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">{current.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
            </div>

            {/* Step dots */}
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>

            <Button onClick={next} className="gap-2 w-full">
              {step < steps.length - 1 ? "Next" : "Get Started"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
