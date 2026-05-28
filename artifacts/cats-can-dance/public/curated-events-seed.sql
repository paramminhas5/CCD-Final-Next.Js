-- CCD Curated Events Seed — run in Supabase SQL editor
-- Seeds the curated_events table with known past and upcoming events.
-- Source "skillboxes" = Skillboxes.com listings.

INSERT INTO curated_events (title, url, source, city, venue, event_date, event_time, blurb, genre, is_featured, created_at, updated_at)
VALUES
  (
    'Cats Can Dance at Bar Wild',
    'https://www.skillboxes.com/events/cats-can-dance-at-bar-wild',
    'skillboxes',
    'Bengaluru',
    'Bar Wild, Indiranagar',
    '2025-04-02',
    '21:00',
    'Episode 1. House, disco, garage and jungle in Indiranagar. Startdawg and Merman on the decks. RSVP only, capacity controlled.',
    '["House", "Disco", "Garage", "Jungle"]',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (url) DO NOTHING;
