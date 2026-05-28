-- ============================================================
-- 005_booking_messages.sql
--
-- Threaded message log attached to a booking_request.
-- Replaces the "reply by email" dead-end with an in-app
-- conversation thread visible to both parties.
--
-- sender_role: 'artist' | 'promoter' | 'system'
-- System messages are auto-generated on status transitions.
-- ============================================================

create table if not exists booking_messages (
  id              uuid primary key default gen_random_uuid(),

  booking_id      uuid not null references booking_requests(id) on delete cascade,

  -- Who sent it
  sender_role     text not null,               -- artist | promoter | system
                  -- artist: identified by booking_requests.artist_id_resolved
                  -- promoter: identified by promoter_clerk_id
  sender_clerk_id text,                        -- null for system messages
  sender_name     text,                        -- display name snapshot

  -- Content
  body            text not null,
  is_system       boolean not null default false,  -- true = auto-generated

  -- Optional quote attachment (when artist sends a formal quote)
  quote_inr       integer,
  quote_valid_until timestamptz,

  -- Read tracking
  read_by_artist    boolean not null default false,
  read_by_promoter  boolean not null default false,

  created_at      timestamptz not null default now(),

  constraint valid_sender_role check (sender_role in ('artist', 'promoter', 'system'))
);

create index if not exists booking_messages_booking_idx
  on booking_messages(booking_id, created_at asc);

create index if not exists booking_messages_unread_artist_idx
  on booking_messages(booking_id)
  where read_by_artist = false and sender_role = 'promoter';

create index if not exists booking_messages_unread_promoter_idx
  on booking_messages(booking_id)
  where read_by_promoter = false and sender_role = 'artist';

alter table booking_messages enable row level security;

-- Artist can see messages for their bookings
create policy "artist read own booking messages"
  on booking_messages for select
  using (
    booking_id in (
      select id from booking_requests
      where artist_id_resolved in (
        select id from artists where claimed_by = auth.uid()::text
      )
    )
  );

-- Promoter can see messages for bookings they own
-- (identified by booking_requests having their email or promoter_clerk_id)
-- We keep this permissive for now; tighten with promoter FK once accounts exist
create policy "promoter read own booking messages"
  on booking_messages for select
  using (sender_clerk_id = auth.uid()::text or is_system = true);
