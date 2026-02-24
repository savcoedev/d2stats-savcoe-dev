import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileHeaderProps {
  onSync: () => void;
  syncing: boolean;
}

const ProfileHeader = ({ onSync, syncing }: ProfileHeaderProps) => {
  const { profile, signOut } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-4 flex-wrap"
    >
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12 border-2 border-primary/30">
          <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.persona_name ?? "User"} />
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {profile?.persona_name?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{profile?.persona_name ?? "Player"}</h2>
          <p className="text-xs text-muted-foreground">
            {profile?.last_synced_at
              ? `Last synced ${new Date(profile.last_synced_at).toLocaleDateString()}`
              : "Not synced yet"}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={syncing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync"}
        </Button>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
