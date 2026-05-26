"use client";
/**
 * FollowButton — heart button shown on artist pages and cards.
 * Persists follow state to user_taste_profiles via /api/user/follow.
 * Falls back to localStorage when user not signed in (with upgrade prompt).
 */
import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { Heart } from "lucide-react";

interface Props {
  artistSlug: string;
  artistName: string;
  /** compact: small icon-only button */
  compact?: boolean;
  /** onToggle: callback with new following state */
  onToggle?: (following: boolean) => void;
}

const LS_KEY = "ccd_followed_artists";

function getLocalFollowed(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function setLocalFollowed(slugs: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(slugs)); } catch {}
}

export default function FollowButton({ artistSlug, artistName, compact = false, onToggle }: Props) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load initial state
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user) {
      fetch(`/api/user/profile?userId=${encodeURIComponent(user.id)}`)
        .then(r => r.json())
        .then(p => {
          setFollowing((p?.liked_artist_slugs ?? []).includes(artistSlug));
        })
        .catch(() => {});
    } else {
      setFollowing(getLocalFollowed().includes(artistSlug));
    }
  }, [isLoaded, isSignedIn, user, artistSlug]);

  async function toggle() {
    if (loading) return;
    const newState = !following;
    setFollowing(newState); // optimistic
    setLoading(true);

    try {
      if (isSignedIn && user) {
        await fetch("/api/user/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            artistSlug,
            action: newState ? "follow" : "unfollow",
          }),
        });
      } else {
        // localStorage fallback
        const local = getLocalFollowed();
        if (newState) {
          if (!local.includes(artistSlug)) setLocalFollowed([...local, artistSlug]);
        } else {
          setLocalFollowed(local.filter(s => s !== artistSlug));
        }
      }
      onToggle?.(newState);
    } catch {
      setFollowing(!newState); // revert on error
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        title={following ? `Unfollow ${artistName}` : `Follow ${artistName}`}
        className={`w-9 h-9 border-2 border-ink flex items-center justify-center transition-all disabled:opacity-50 ${
          following
            ? "bg-magenta border-magenta text-cream hover:bg-magenta/80"
            : "bg-cream text-ink hover:bg-acid-yellow"
        }`}
      >
        <Heart className={`w-4 h-4 ${following ? "fill-current" : ""}`} />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 font-display text-xs uppercase px-4 py-2.5 border-4 border-ink transition-all disabled:opacity-50 chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
        following
          ? "bg-magenta text-cream border-magenta"
          : "bg-cream text-ink hover:bg-acid-yellow"
      }`}
    >
      <Heart className={`w-3.5 h-3.5 ${following ? "fill-current" : ""}`} />
      {following ? "Following" : "Follow"}
    </button>
  );
}
