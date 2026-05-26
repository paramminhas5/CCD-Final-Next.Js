UPDATE public.site_settings
SET playlists = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN elem ? 'platform' THEN elem
      ELSE jsonb_build_object(
        'id', COALESCE(elem->>'id', gen_random_uuid()::text),
        'title', COALESCE(elem->>'title', 'Playlist'),
        'platform', 'spotify',
        'embed_id', COALESCE(elem->>'spotify_id', elem->>'embed_id', ''),
        'url', CASE
          WHEN elem->>'spotify_id' IS NOT NULL THEN 'https://open.spotify.com/playlist/' || (elem->>'spotify_id')
          WHEN elem->>'embed_id' IS NOT NULL THEN 'https://open.spotify.com/playlist/' || (elem->>'embed_id')
          ELSE ''
        END
      )
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(playlists) AS elem
)
WHERE id = 'main';