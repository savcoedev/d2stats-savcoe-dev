
-- Users table linked to auth.users
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_uid UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  steam_id TEXT NOT NULL UNIQUE,
  persona_name TEXT,
  avatar_url TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  game_mode INTEGER NOT NULL,
  game_mode_name TEXT,
  hero_id INTEGER,
  hero_name TEXT,
  is_win BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- Player match stats junction table
CREATE TABLE public.player_match_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL,
  lane_role INTEGER,
  lane_role_name TEXT,
  is_win BOOLEAN,
  map_pressure_score REAL DEFAULT 0,
  combat_score REAL DEFAULT 0,
  survival_rate REAL DEFAULT 0,
  game_mode INTEGER NOT NULL,
  game_mode_name TEXT,
  hero_id INTEGER,
  hero_name TEXT,
  duration INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  gpm INTEGER DEFAULT 0,
  xpm INTEGER DEFAULT 0,
  last_hits INTEGER DEFAULT 0,
  denies INTEGER DEFAULT 0,
  tower_damage INTEGER DEFAULT 0,
  hero_damage INTEGER DEFAULT 0,
  hero_healing INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;

-- Users: read own data
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = auth_uid);

-- Users: insert own profile (for edge function creating via service_role, this is bypassed)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = auth_uid);

-- Users: update own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = auth_uid);

-- Matches: read own data (join through users table)
CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = user_id AND u.auth_uid = auth.uid()
    )
  );

-- Player match stats: read own data
CREATE POLICY "Users can view own stats"
  ON public.player_match_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = user_id AND u.auth_uid = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX idx_matches_user_id ON public.matches(user_id);
CREATE INDEX idx_matches_match_id ON public.matches(match_id);
CREATE INDEX idx_player_match_stats_user_id ON public.player_match_stats(user_id);
CREATE INDEX idx_player_match_stats_game_mode ON public.player_match_stats(game_mode);
CREATE INDEX idx_users_steam_id ON public.users(steam_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
