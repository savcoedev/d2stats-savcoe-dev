import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Users, Trophy } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Friend {
  steam_id: string;
  persona_name: string;
  avatar_url: string | null;
  avg_combat: number;
  avg_map_pressure: number;
  avg_survival: number;
}

interface FriendsLeaderboardProps {
  friends: Friend[];
  loading: boolean;
}

const FriendsLeaderboard = ({ friends, loading }: FriendsLeaderboardProps) => {
  const [open, setOpen] = useState(false);

  const sorted = [...friends].sort(
    (a, b) => (b.avg_combat + b.avg_map_pressure + b.avg_survival) - (a.avg_combat + a.avg_map_pressure + a.avg_survival)
  );

  return (
    <>
      {/* Toggle tab */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 glass-card px-2 py-4 rounded-l-xl border-r-0 flex flex-col items-center gap-2 hover:bg-secondary/30 transition-colors"
      >
        <Users className="w-4 h-4 text-primary" />
        <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            className="fixed right-0 top-0 bottom-0 w-80 z-30 glass-card rounded-l-2xl border-r-0 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Friends Leaderboard</h3>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-lg bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No friends on the platform yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {sorted.map((friend, idx) => {
                    const totalAvg = Math.round((friend.avg_combat + friend.avg_map_pressure + friend.avg_survival) / 3);
                    return (
                      <motion.div
                        key={friend.steam_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={friend.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs bg-secondary">{friend.persona_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{friend.persona_name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{totalAvg}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FriendsLeaderboard;
