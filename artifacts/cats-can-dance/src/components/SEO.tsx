import { useEffect } from "react";

type Props = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  type?: "website" | "article" | "product" | "event";
  keywords?: string;
  noindex?: boolean;
};

const SITE = "https://catscandance.com";
const DEFAULT_OG = `${SITE}/og-image.jpg?v=2`;

const absolute = (img: string) => (img.startsWith("http") ? img : `${SITE}${img.startsWith("/") ? "" : "/"}${img}`);

const SEO = ({ title, description, path = "/", image, imageAlt, jsonLd, type = "website", keywords, noindex }: Props) => {
  const url = `${SITE}${path}`;
  const og = image ? absolute(image) : DEFAULT_OG;
  const isJpg = /\.jpe?g(\?|$)/i.test(og);
  const ogType = isJpg ? "image/jpeg" : "image/png";
  const alt = imageAlt ?? title;
  const ldArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  useEffect(() => {
    document.title = title;
    const setMeta = (sel: string, content: string) => {
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (sel.includes("property=")) el.setAttribute("property", sel.match(/property="([^"]+)"/)?.[1] ?? "");
        else if (sel.includes("name=")) el.setAttribute("name", sel.match(/name="([^"]+)"/)?.[1] ?? "");
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    if (keywords) setMeta('meta[name="keywords"]', keywords);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[property="og:type"]', type === "article" ? "article" : "website");
    setMeta('meta[property="og:image"]', og);
    setMeta('meta[property="og:image:secure_url"]', og);
    setMeta('meta[property="og:image:type"]', ogType);
    setMeta('meta[property="og:image:alt"]', alt);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', og);
    setMeta('meta[name="twitter:image:alt"]', alt);

    // Canonical link
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = url;

    // JSON-LD
    document.querySelectorAll('script[data-seo-ld]').forEach(el => el.remove());
    ldArray.forEach((obj) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-seo-ld", "true");
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    });
    return () => { document.querySelectorAll('script[data-seo-ld]').forEach(el => el.remove()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, type, keywords, noindex]);

  return null;
};

export default SEO;
