import { useEffect, useState } from "react";
import { useDisco } from "@/contexts/DiscoContext";

const AUDIO_SRC = "/audio/disco-loop.mp3";
const FADE_MS = 600;
const TARGET_VOL = 0.5;

const clamp = (v: number) => Math.max(0, Math.min(1, v));

// Module-level singleton so we can play imperatively from a user gesture.
let audioEl: HTMLAudioElement | null = null;
let available = true;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const getAudio = () => {
  if (audioEl) return audioEl;
  if (typeof window === "undefined") return null;
  const a = new Audio(AUDIO_SRC);
  a.loop = true;
  a.preload = "auto";
  a.volume = 0;
  a.addEventListener("error", () => {
    available = false;
    notify();
  });
  audioEl = a;
  return a;
};

const fadeTo = (target: number) => {
  const el = audioEl;
  if (!el) return;
  const start = el.volume;
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / FADE_MS);
    el.volume = clamp(start + (target - start) * k);
    if (k < 1) requestAnimationFrame(step);
    else if (target === 0) el.pause();
  };
  requestAnimationFrame(step);
};

/** Call from a user gesture (e.g. Disco button click) to start playback. */
export const playDiscoNow = () => {
  const el = getAudio();
  if (!el || !available) return;
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  el.volume = 0;
  el.play().then(() => fadeTo(TARGET_VOL)).catch(() => {/* blocked */});
};

export const stopDiscoNow = () => {
  if (!audioEl) return;
  fadeTo(0);
};

export const useDiscoAudio = () => {
  const { disco } = useDisco();
  const [muted, setMuted] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    getAudio();
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  // React to disco/muted changes (handles toggle off + mute toggling)
  useEffect(() => {
    const el = getAudio();
    if (!el || !available) return;
    if (disco && !muted) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
      el.play().then(() => fadeTo(TARGET_VOL)).catch(() => {/* blocked, requires gesture */});
    } else {
      fadeTo(0);
    }
  }, [disco, muted]);

  return { muted, setMuted, available };
};
