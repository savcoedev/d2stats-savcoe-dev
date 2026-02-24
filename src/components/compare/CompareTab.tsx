import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import RadarComparison from "./RadarComparison";
import PlayerBreakdown from "./PlayerBreakdown";
import StatusBanner from "@/components/ui/StatusBanner";

const CompareTab = () => {
  const [ids, setIds] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    const validIds = ids.filter(id => id.trim().length > 0);
    if (validIds.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("compare-players", {
        body: { steam_ids: validIds },
      });
      if (fnError) throw fnError;
      setPlayers(data.players);

      const notFound = data.players.filter((p: any) => !p.found);
      if (notFound.length > 0) {
        setError(`Players not found on platform: ${notFound.map((p: any) => p.steam_id).join(", ")}`);
      }
    } catch (e: any) {
      setError(e.message ?? "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const foundPlayers = players?.filter((p: any) => p.found) ?? [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-base font-semibold mb-4">Compare Players</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {ids.map((id, i) => (
            <Input
              key={i}
              value={id}
              onChange={(e) => {
                const next = [...ids];
                next[i] = e.target.value;
                setIds(next);
              }}
              placeholder={`Steam ID ${i + 1}${i === 0 ? " (required)" : " (optional)"}`}
              className="bg-secondary/50"
            />
          ))}
        </div>
        <Button onClick={handleCompare} disabled={loading || !ids[0].trim()} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Compare
        </Button>
      </motion.div>

      <StatusBanner variant="private-profile" message={error ?? ""} visible={!!error} onDismiss={() => setError(null)} />

      {foundPlayers.length > 0 && (
        <>
          <RadarComparison players={foundPlayers} />
          <PlayerBreakdown players={players!} />
        </>
      )}
    </div>
  );
};

export default CompareTab;
