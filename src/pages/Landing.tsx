import { motion } from "framer-motion";
import { Shield, Crosshair, Heart, TrendingUp, Users, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEAM_LOGIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-auth?action=login&redirect_uri=${encodeURIComponent(window.location.origin)}`;

const features = [
  {
    icon: Crosshair,
    title: "Combat Score",
    desc: "Role-weighted kill participation, hero damage, and fight contribution normalized to 40-minute baseline.",
  },
  {
    icon: Shield,
    title: "Map Pressure",
    desc: "Tower damage, last hits, denies, and GPM weighted by your lane position (Pos 1–5).",
  },
  {
    icon: Heart,
    title: "Survival Rate",
    desc: "Deaths per engagement, positioning efficiency, and recovery patterns across game modes.",
  },
  {
    icon: TrendingUp,
    title: "Trend Analytics",
    desc: "Rolling performance over your last 20 matches with game mode segregation.",
  },
  {
    icon: Users,
    title: "Friends Leaderboard",
    desc: "Compare your role scores against your Steam friends in real-time.",
  },
  {
    icon: Gamepad2,
    title: "Mode Segregation",
    desc: "Strict filtering between Ranked, Normal, and Turbo — no cross-contamination.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const Landing = () => {
  return (
    <div className="min-h-screen gradient-bg overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px] animate-pulse-glow pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-[100px] animate-pulse-glow pointer-events-none" style={{ animationDelay: "1.5s" }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full glass-card text-sm text-muted-foreground"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Role-Aware Analytics Engine
          </motion.div>

          <h1 className="font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-foreground">Know Your </span>
            <span className="text-gradient">Lane Impact</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Context-aware scoring for Dota 2. Track combat efficiency, map pressure, and survival rate — 
            weighted by your role, normalized across game modes.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <a href={STEAM_LOGIN_URL}>
              <Button size="lg" className="gap-3 px-8 py-6 text-base font-semibold rounded-xl glow-border bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 2C6.48 2 2 6.04 2 11.04c0 3.15 1.74 5.9 4.32 7.46l3.86-2.25a2.5 2.5 0 0 1 2.64 4.24l-1.58.92C11.5 21.8 11.75 22 12 22c5.52 0 10-4.04 10-9.04S17.52 2 12 2zm4.5 9.54a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                </svg>
                Sign in with Steam
              </Button>
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 py-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-bold tracking-tight mb-4">
            Beyond <span className="text-gradient">KDA</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Generic stats lie. Role-weighted scoring tells the truth about your lane impact.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={itemVariants} className="glass-card-hover p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Footer */}
      <section className="px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card max-w-2xl mx-auto p-10"
        >
          <h2 className="font-bold mb-4">Ready to Rank Up?</h2>
          <p className="text-muted-foreground mb-8">
            Connect your Steam account and get your first role-weighted analysis in seconds.
          </p>
          <a href={STEAM_LOGIN_URL}>
            <Button size="lg" className="gap-3 px-8 py-6 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 2C6.48 2 2 6.04 2 11.04c0 3.15 1.74 5.9 4.32 7.46l3.86-2.25a2.5 2.5 0 0 1 2.64 4.24l-1.58.92C11.5 21.8 11.75 22 12 22c5.52 0 10-4.04 10-9.04S17.52 2 12 2zm4.5 9.54a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
              </svg>
              Get Started Free
            </Button>
          </a>
        </motion.div>
      </section>
    </div>
  );
};

export default Landing;
