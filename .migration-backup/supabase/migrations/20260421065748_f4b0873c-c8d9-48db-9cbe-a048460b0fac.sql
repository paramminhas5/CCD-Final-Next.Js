CREATE TABLE public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  plus_ones INTEGER NOT NULL DEFAULT 0,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_slug, email)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can RSVP"
ON public.event_rsvps
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE INDEX idx_event_rsvps_event_slug ON public.event_rsvps(event_slug);
CREATE INDEX idx_event_rsvps_created_at ON public.event_rsvps(created_at DESC);