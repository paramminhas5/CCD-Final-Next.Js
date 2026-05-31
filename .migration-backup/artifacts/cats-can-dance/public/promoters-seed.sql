-- CCD Promoters Seed — run in Supabase SQL editor
-- Adds known trusted promoters to the directory.
-- Safe to re-run (uses ON CONFLICT DO NOTHING on slug).

INSERT INTO promoters (slug, name, city, cities, genres, blurb, instagram, website, booking_email, trusted, status, created_at, updated_at)
VALUES
  (
    'krunk',
    'Krunk',
    'Mumbai',
    ARRAY['Mumbai', 'Bengaluru', 'Delhi', 'Goa'],
    ARRAY['Techno', 'House', 'Bass Music', 'D&B'],
    'Founded in 2009, Krunk is one of India''s oldest and most respected booking agencies and event production companies. Architects of Bass Camp Festival and Echoes of Earth. Over 2,000 events and counting.',
    'krunklive',
    'https://krunklive.com',
    'bookings@krunklive.com',
    true,
    'active',
    NOW(),
    NOW()
  ),
  (
    'drum-and-bass-india',
    'Drum and Bass India',
    'Bengaluru',
    ARRAY['Bengaluru', 'Mumbai', 'Hyderabad', 'Goa'],
    ARRAY['Drum & Bass', 'Jungle', 'Liquid DnB'],
    'India''s longest-running D&B and Jungle collective. Based in Bengaluru, running DnBIndia × SOCIAL nights and regular underground sessions across the country. The pack that keeps D&B alive in India.',
    'dnbindia',
    'https://ra.co/promoters/99325',
    null,
    true,
    'active',
    NOW(),
    NOW()
  ),
  (
    'qilla-records',
    'Qilla Records',
    'Delhi',
    ARRAY['Delhi', 'Mumbai', 'Bengaluru'],
    ARRAY['Techno', 'Minimal', 'Industrial Techno', 'Experimental'],
    'Founded by Madhav Shorey (Kohra), Qilla is the label and collective at the heart of India''s techno scene. Internationally connected — Tresor, Berghain, Movement. The standard-setters for serious electronic music in India.',
    'qillarecords',
    'https://qillarecords.com',
    null,
    true,
    'active',
    NOW(),
    NOW()
  ),
  (
    'levitate',
    'Levitate',
    'Mumbai',
    ARRAY['Mumbai', 'Bengaluru', 'Delhi'],
    ARRAY['Techno', 'House', 'Electronic'],
    'Mumbai and Bangalore-based agency focused on the electronic music space. Consistent promoters of quality underground events across India.',
    'levitate_india',
    'https://ra.co/promoters/86167',
    null,
    true,
    'active',
    NOW(),
    NOW()
  ),
  (
    'subculture-blr',
    'Subculture BLR',
    'Bengaluru',
    ARRAY['Bengaluru'],
    ARRAY['Techno', 'House', 'Electronic'],
    'Bengaluru-based underground electronic music collective and venue programming team. A key pillar of the city''s nightlife ecosystem.',
    'subcultureblr',
    null,
    null,
    true,
    'active',
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
