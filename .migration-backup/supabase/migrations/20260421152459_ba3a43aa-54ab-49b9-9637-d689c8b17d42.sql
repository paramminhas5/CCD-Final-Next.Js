-- site_settings (singleton)
CREATE TABLE public.site_settings (
  id text PRIMARY KEY,
  playlists jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured_playlist_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);

INSERT INTO public.site_settings (id, playlists, featured_playlist_id)
VALUES (
  'main',
  '[{"id":"main","title":"Now Spinning","spotify_id":"1cEE860l9GiBvIYVM2BbSS"}]'::jsonb,
  'main'
);

-- events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  date text NOT NULL,
  city text NOT NULL,
  venue text NOT NULL,
  blurb text NOT NULL DEFAULT '',
  lineup jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'upcoming',
  poster_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed events
INSERT INTO public.events (slug, title, date, city, venue, blurb, lineup, status, poster_url, sort_order) VALUES
('episode-1', 'EPISODE 01', 'JUL 12, 2025', 'BROOKLYN, NY', 'The Meow Loft', 'The first ever Cats Can Dance party. Sold out in 4 hours. The cats danced. So did we.', '["DJ Whiskers","MC Mittens","Tabby T"]'::jsonb, 'past', '/episode-1.gif', 1),
('episode-2', 'EPISODE 02', 'AUG 23, 2025', 'LOS ANGELES, CA', 'Catnip Club', 'West coast debut. Bigger sound, bigger litter box, bigger vibes.', '["Felix Fresh","Purr Machine","Lil Paw"]'::jsonb, 'upcoming', null, 2);

-- contact_messages
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);