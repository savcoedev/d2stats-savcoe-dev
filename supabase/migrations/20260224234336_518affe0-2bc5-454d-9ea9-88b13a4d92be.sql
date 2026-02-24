
-- Create heroes dictionary table (public read, no RLS needed for public data)
CREATE TABLE public.heroes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  localized_name TEXT NOT NULL,
  icon_url TEXT,
  image_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read
ALTER TABLE public.heroes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Heroes are publicly readable"
  ON public.heroes
  FOR SELECT
  USING (true);
