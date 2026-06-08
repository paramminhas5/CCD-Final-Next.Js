"use client";
/**
 * MiniAudioPlayer — Sticky floating audio player for artist profiles.
 *
 * Appears at the bottom of the screen when viewing an artist who has a
 * SoundCloud or Spotify track. Allows the user to listen while browsing
 * the artist's other tabs (gigs, connections, booking form, etc.)
 *
 * Shows:
 *   - Artist name + currently playing platform
 *   - Embedded SoundCloud/Spotify iframe (collapsed by default, expands on click)
 *   - Minimize / close buttons
 *
 * Dismissed state is stored in sessionStorage so it doesn't re-appear
 * if the user explicitly closes it.
 */

import { useEffect, useState } from "react";
import { Music, ChevronUp, ChevronDown, X, Headphones } from "lucide-react";

interface MiniAudioPlayerProps {
  artistName: string;
  soundcloud?: string | null;
  spotify?: string | null;
  /** Shown on all tabs EXCEPT the HOME tab where the full embed already exists */
  activeTab: string;
}

function getSoundCloudEmbed(url: string): string {
  if (!url) return "";
  const encoded = encodeURIComponent(url);
  return `https://w.soundcloud.com/player/?url=${encoded}&color=%23e040fb&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;
}

function getSpotifyEmbed(url: string): string {
  if (!url) return "";
  // Convert to embed URL
  const match = url.match(/spotify\.com\/(track|album|artist|playlist)\/([a-zA-Z0-9]+)/);
  if (!match) return "";
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
}

export default function MiniAudioPlayer({
  artistName,
  soundcloud,
  spotify,
  activeTab,
}: MiniAudioPlayerProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const sessionKey = `ccd-mini-player-dismissed-${artistName.toLowerCase().replace(/\s+/g, "-")}`;

  useEffect(() => {
    // Check if user dismissed this artist's player this session
    if (typeof sessionStorage !== "undefined") {
      const wasDismissed = sessionStorage.getItem(sessionKey) === "1";
      if (wasDismissed) setDismissed(true);
    }
  }, [sessionKey]);

  // Only show on non-home tabs (home already has the full embed)
  const shouldShow = activeTab !== "home" && !dismissed;

  // Determine which platform to show
  const scEmbed = soundcloud ? getSoundCloudEmbed(soundcloud) : null;
  const spEmbed = spotify ? getSpotifyEmbed(spotify) : null;
  const hasAudio = !!(scEmbed || spEmbed);
  const platformLabel = scEmbed ? "SoundCloud" : "Spotify";

  if (!hasAudio || !shouldShow) return null;

  function dismiss() {
    setDismissed(true);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(sessionKey, "1");
    }
  }

  return (
    <div
      className={`fixed bottom-0 md:bottom-6 md:right-6 left-0 md:left-auto z-40 w-full md:w-80 border-t-4 md:border-4 border-ink bg-ink text-cream shadow-2xl transition-all duration-300 ${
        expanded ? "md:rounded-none" : ""
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 bg-magenta border-2 border-cream/40 flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-cream" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-xs uppercase text-cream leading-tight truncate">
            {artistName}
          </p>
          <p className="font-display text-[10px] text-cream/50 uppercase flex items-center gap-1">
            <Headphones className="w-2.5 h-2.5" /> {platformLabel}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-7 h-7 border-2 border-cream/30 flex items-center justify-center hover:bg-cream/10 transition-colors shrink-0"
          title={expanded ? "Minimize" : "Show player"}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-cream" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-cream" />
          )}
        </button>
        <button
          onClick={dismiss}
          className="w-7 h-7 border-2 border-cream/30 flex items-center justify-center hover:bg-cream/10 transition-colors shrink-0"
          title="Close player"
        >
          <X className="w-3.5 h-3.5 text-cream" />
        </button>
      </div>

      {/* Embedded player */}
      {expanded && (
        <div className="border-t-4 border-cream/20">
          {scEmbed && (
            <iframe
              src={scEmbed}
              width="100%"
              height="100"
              allow="autoplay"
              className="block"
              title={`${artistName} on SoundCloud`}
            />
          )}
          {!scEmbed && spEmbed && (
            <iframe
              src={spEmbed}
              width="100%"
              height="80"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="block"
              title={`${artistName} on Spotify`}
            />
          )}
        </div>
      )}
    </div>
  );
}
