/**
 * Normalise a static-image import to a plain URL string.
 *
 * Next.js PNG/JPG imports return a StaticImageData object  { src, width, height }
 * while the original Vite build returned a bare URL string.
 * Passing StaticImageData directly to <img src={}> renders "[object Object]".
 * This helper abstracts the difference so the Vite-migrated source works unchanged.
 */
export function imgUrl(img: unknown): string {
  if (typeof img === "string") return img;
  if (img && typeof img === "object" && "src" in img) {
    return (img as { src: string }).src;
  }
  return String(img);
}
