"use client";
/**
 * ArtistGallery — Masonry photo gallery for the artist profile page.
 *
 * Renders artist's gallery[] images (stored as array of objects with url field,
 * or plain URL strings). Shows a lightbox when a photo is clicked.
 * Skips rendering entirely if there are no images.
 */

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

interface GalleryItem {
  url?: string;
  src?: string;
  alt?: string;
  caption?: string;
}

function normalise(item: GalleryItem | string): { url: string; caption?: string } | null {
  if (typeof item === "string") return item.trim() ? { url: item.trim() } : null;
  const url = item.url ?? item.src ?? "";
  if (!url.trim()) return null;
  return { url, caption: item.caption ?? item.alt };
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({
  images,
  index,
  onClose,
}: {
  images: { url: string; caption?: string }[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);

  const prev = () => setCurrent((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === images.length - 1 ? 0 : i + 1));

  const img = images[current];

  return (
    <div className="fixed inset-0 z-[60] bg-ink/95 flex items-center justify-center p-4">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 border-4 border-cream/40 bg-ink text-cream flex items-center justify-center hover:bg-cream/10 transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 font-display text-xs text-cream/50 uppercase">
        {current + 1} / {images.length}
      </div>

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 w-10 h-10 border-4 border-cream/40 bg-ink text-cream flex items-center justify-center hover:bg-cream/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 w-10 h-10 border-4 border-cream/40 bg-ink text-cream flex items-center justify-center hover:bg-cream/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Image */}
      <div className="max-w-3xl w-full max-h-[80vh] flex flex-col items-center">
        <img
          src={img.url}
          alt={img.caption ?? "Gallery photo"}
          className="max-h-[70vh] max-w-full object-contain border-4 border-cream/20"
          loading="lazy"
        />
        {img.caption && (
          <p className="mt-3 font-display text-sm text-cream/60 uppercase text-center">{img.caption}</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ArtistGallery({
  gallery,
  artistName,
}: {
  gallery?: any[] | null;
  artistName: string;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!gallery || gallery.length === 0) return null;

  const images = gallery
    .map(normalise)
    .filter((img): img is { url: string; caption?: string } => img !== null)
    .slice(0, 12); // max 12 photos

  if (images.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="font-display text-magenta text-xs uppercase tracking-[0.3em]">/ GALLERY</p>
        <span className="font-display text-xs text-ink/40">{images.length} photos</span>
      </div>

      {/* Masonry-ish grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setLightboxIdx(i)}
            className={`group relative border-4 border-ink overflow-hidden bg-ink/10 ${
              i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
            }`}
          >
            <img
              src={img.url}
              alt={img.caption ?? `${artistName} photo ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors flex items-center justify-center">
              <Images className="w-6 h-6 text-cream opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </section>
  );
}
