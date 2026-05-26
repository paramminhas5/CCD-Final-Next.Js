
-- Create public bucket for event posters
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read of poster images
CREATE POLICY "Event posters are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-posters');
