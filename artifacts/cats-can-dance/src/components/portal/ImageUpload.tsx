"use client";
/**
 * ImageUpload — Artist Portal photo upload component
 *
 * Replaces the old URL-paste pattern for artist photos and gallery images.
 * Uses a Supabase Storage signed-upload URL (via /api/storage/sign-upload)
 * so the file goes directly from browser → Supabase Storage, never through
 * the Next.js serverless function (avoids the 4.5 MB Vercel body limit).
 *
 * Flow:
 *   1. User selects image (drag-drop or click)
 *   2. Preview shown locally with FileReader
 *   3. POST /api/storage/sign-upload → { signedUrl, publicUrl }
 *   4. Browser PUT → signedUrl (direct to Supabase Storage)
 *   5. onUpload(publicUrl) called → parent saves to artist profile
 */

import { useCallback, useRef, useState } from "react";
import { Upload, Loader2, X, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  /** Current image URL (shown as preview) */
  currentUrl?: string | null;
  /** Called with the new public URL after successful upload */
  onUpload: (url: string) => void;
  /** Storage path prefix — e.g. "artists" or "gallery" */
  bucket?: string;
  label?: string;
  hint?: string;
  /** Max file size in MB (default: 5) */
  maxMb?: number;
  /** Aspect ratio class for preview (default: aspect-square) */
  aspectClass?: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_DIMENSION = 2400; // px — we downsample client-side for perf

function clientDownsample(file: File, maxPx: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/jpeg", 0.92);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUpload({
  currentUrl,
  onUpload,
  bucket = "artist-photos",
  label = "Photo",
  hint = "JPG, PNG or WebP · Max 5 MB",
  maxMb = 5,
  aspectClass = "aspect-square",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const displayUrl = preview ?? currentUrl ?? null;

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Only JPG, PNG, WebP and GIF files are supported");
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File too large — max ${maxMb} MB`);
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setProgress(10);

    try {
      // 1. Downsample if needed
      const blob = await clientDownsample(file, MAX_DIMENSION);
      setProgress(25);

      // 2. Get signed upload URL from server
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const signRes = await fetch("/api/storage/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket, ext, mimeType: "image/jpeg" }),
      });
      if (!signRes.ok) {
        const err = await signRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to get upload URL");
      }
      const { signedUrl, publicUrl } = await signRes.json();
      setProgress(40);

      // 3. Upload directly to Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (!uploadRes.ok) throw new Error(`Storage upload failed (${uploadRes.status})`);
      setProgress(100);

      // 4. Notify parent
      onUpload(publicUrl);
      toast.success("Photo uploaded!");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // reset so same file can be re-selected
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  return (
    <div className="space-y-2">
      <span className="font-display text-xs uppercase text-ink/70 block">{label}</span>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative border-4 border-ink cursor-pointer overflow-hidden transition-colors ${aspectClass} ${dragOver ? "bg-acid-yellow/30" : "bg-cream"} ${uploading ? "pointer-events-none" : "hover:bg-acid-yellow/20"}`}
      >
        {/* Preview / placeholder */}
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink/40">
            <ImageIcon className="w-10 h-10" />
            <p className="font-display text-xs uppercase text-center px-4">{hint}</p>
          </div>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-ink/70 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-acid-yellow animate-spin" />
            <p className="font-display text-xs text-cream uppercase">{progress}%</p>
            <div className="w-24 h-1.5 bg-cream/30 overflow-hidden">
              <div className="h-full bg-acid-yellow transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Drag-over overlay */}
        {dragOver && !uploading && (
          <div className="absolute inset-0 bg-acid-yellow/60 flex items-center justify-center">
            <p className="font-display text-sm uppercase text-ink">Drop to upload</p>
          </div>
        )}

        {/* Success tick */}
        {displayUrl && !uploading && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-lime border-2 border-ink flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-ink" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 font-display text-xs uppercase px-3 py-1.5 border-4 border-ink bg-ink text-cream hover:bg-magenta transition-colors disabled:opacity-50"
        >
          <Upload className="w-3 h-3" />
          {displayUrl ? "Replace" : "Upload"}
        </button>
        {displayUrl && (
          <button
            type="button"
            onClick={() => { setPreview(null); onUpload(""); }}
            className="flex items-center gap-1 font-display text-xs uppercase px-3 py-1.5 border-4 border-ink text-ink/60 hover:bg-ink/10 transition-colors"
          >
            <X className="w-3 h-3" /> Remove
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
