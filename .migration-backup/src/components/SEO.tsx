import { Helmet } from "react-helmet-async";

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
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="Cats Can Dance" />
      <meta
        name="robots"
        content={
          noindex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      />
      <meta name="theme-color" content="#ff2bd6" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#0E0E10" media="(prefers-color-scheme: dark)" />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type === "article" ? "article" : "website"} />
      <meta property="og:site_name" content="Cats Can Dance" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:image" content={og} />
      <meta property="og:image:secure_url" content={og} />
      <meta property="og:image:type" content={ogType} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={alt} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@catscandance" />
      <meta name="twitter:creator" content="@catscandance" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={og} />
      <meta name="twitter:image:alt" content={alt} />

      {ldArray.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
