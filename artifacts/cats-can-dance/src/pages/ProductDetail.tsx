import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { PRODUCT_BY_HANDLE_QUERY, storefrontApiRequest } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, X } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CartDrawer } from "@/components/CartDrawer";

// ── Size guide data ────────────────────────────────────────────────────────────
const SIZE_GUIDE = [
  { size: "S",   chest: "36–38\"",  length: "27\"",  waist: "28–30\"" },
  { size: "M",   chest: "38–40\"",  length: "28\"",  waist: "30–32\"" },
  { size: "L",   chest: "40–42\"",  length: "29\"",  waist: "32–34\"" },
  { size: "XL",  chest: "42–44\"",  length: "30\"",  waist: "34–36\"" },
  { size: "XXL", chest: "44–46\"",  length: "31\"",  waist: "36–38\"" },
];

function SizeGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
    >
      <div
        className="bg-cream border-4 border-ink chunk-shadow max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close size guide"
          className="absolute top-3 right-3 w-8 h-8 border-2 border-ink grid place-items-center hover:bg-acid-yellow transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="font-display text-2xl text-ink mb-1">SIZE GUIDE</h2>
        <p className="text-xs text-ink/50 mb-4 font-medium">All measurements are in inches. Screen-printed on heavyweight 240gsm cotton — fits true to size.</p>
        <table className="w-full border-4 border-ink text-sm">
          <thead className="bg-ink text-cream font-display">
            <tr>
              <th className="px-3 py-2 text-left">SIZE</th>
              <th className="px-3 py-2 text-left">CHEST</th>
              <th className="px-3 py-2 text-left">LENGTH</th>
              <th className="px-3 py-2 text-left">WAIST</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_GUIDE.map((row, i) => (
              <tr key={row.size} className={`border-t-2 border-ink/20 ${i % 2 === 0 ? "bg-cream" : "bg-acid-yellow/20"}`}>
                <td className="px-3 py-2 font-display text-ink">{row.size}</td>
                <td className="px-3 py-2 text-ink/80">{row.chest}</td>
                <td className="px-3 py-2 text-ink/80">{row.length}</td>
                <td className="px-3 py-2 text-ink/80">{row.waist}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-ink/40 mt-3">Size exchanges within 7 days of delivery on unworn pieces.</p>
      </div>
    </div>
  );
}

const ProductDetail = () => {
  const [, navigate] = useLocation();
  const { handle } = useParams<{ handle?: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
        const p = data?.data?.product;
        setProduct(p);
        if (p?.variants?.edges?.[0]?.node?.id) {
          setSelectedVariantId(p.variants.edges[0].node.id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [handle]);

  const variant = product?.variants?.edges?.find((e: any) => e.node.id === selectedVariantId)?.node;
  const img = product?.images?.edges?.[0]?.node;

  const productLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description,
        image: img?.url ? [img.url] : undefined,
        sku: variant?.id,
        brand: { "@type": "Brand", name: "Cats Can Dance" },
        category: "Streetwear",
        audience: { "@type": "PeopleAudience", suggestedGender: "unisex" },
        url: `https://catscandance.com/product/${handle}`,
        additionalProperty: [
          { "@type": "PropertyValue", name: "Edition", value: "Limited drop" },
          { "@type": "PropertyValue", name: "Origin", value: "Screen-printed in Bangalore, India" },
        ],
        offers: variant
          ? {
              "@type": "Offer",
              price: variant.price.amount,
              priceCurrency: variant.price.currencyCode,
              availability: "https://schema.org/InStock",
              url: `https://catscandance.com/product/${handle}`,
            }
          : undefined,
      }
    : null;

  const productFaqLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is this a limited drop?",
            acceptedAnswer: { "@type": "Answer", text: "Yes — every Cats Can Dance piece is a limited drop with no restocks. Once it's gone, it's gone." },
          },
          {
            "@type": "Question",
            name: "Where does it ship from?",
            acceptedAnswer: { "@type": "Answer", text: "All Cats Can Dance orders ship from Bangalore, India. Pan-India shipping is available on every order." },
          },
          {
            "@type": "Question",
            name: "What's the return and exchange policy?",
            acceptedAnswer: { "@type": "Answer", text: "We offer size exchanges within 7 days of delivery on unworn pieces. Limited drops are not eligible for refund." },
          },
          {
            "@type": "Question",
            name: "How is it made?",
            acceptedAnswer: { "@type": "Answer", text: "Screen-printed in Bangalore on heavyweight cotton. Cats Can Dance drops are produced in small runs tied to our underground music Episodes." },
          },
        ],
      }
    : null;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = product ? `${product.title} — Cats Can Dance` : "";

  return (
    <>
      <SEO
        title={product ? `${product.title} — Cats Can Dance Streetwear Drop` : "Product"}
        description={
          product?.description?.slice(0, 155) ||
          "Limited streetwear drop and music collectible from Cats Can Dance, Bangalore."
        }
        path={`/product/${handle}`}
        image={img?.url}
        type="product"
        jsonLd={productLd ? [productLd, ...(productFaqLd ? [productFaqLd] : [])] : undefined}
      />
      <main className="bg-cream text-ink min-h-screen">
        <Nav />
        {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}
        <section className="container py-16 md:py-24 relative">
          <div className="absolute top-8 right-4 md:right-8 z-10">
            <CartDrawer />
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 mb-8 font-bold hover:text-magenta">
            <ArrowLeft className="w-4 h-4" /> BACK TO SHOP
          </Link>

          {loading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : !product ? (
            <p className="font-display text-3xl">PRODUCT NOT FOUND</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-12">
              <div className="aspect-square border-4 border-ink chunk-shadow bg-acid-yellow overflow-hidden">
                {img && (
                  <img
                    src={img.url}
                    alt={img.altText || `${product.title} — Cats Can Dance limited streetwear drop, Bangalore`}
                    loading="eager"
                    fetchPriority="high"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <span className="inline-block bg-magenta text-cream text-xs font-bold px-3 py-1 mb-3">
                  LIMITED DROP · BANGALORE
                </span>
                <h1 className="font-display text-5xl md:text-6xl mb-4 leading-[0.9]">{product.title}</h1>
                <p className="font-display text-3xl mb-6">
                  {variant?.price.currencyCode} {parseFloat(variant?.price.amount || "0").toFixed(2)}
                </p>
                <p className="text-lg mb-8 leading-relaxed">{product.description}</p>

                {product.options?.[0] && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold">{product.options[0].name.toUpperCase()}</p>
                      <button
                        type="button"
                        onClick={() => setShowSizeGuide(true)}
                        className="font-display text-xs uppercase text-magenta underline decoration-2 underline-offset-2 hover:text-ink transition-colors"
                      >
                        Size Guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.edges.map((e: any) => {
                        const outOfStock = e.node.availableForSale === false;
                        return (
                          <button
                            key={e.node.id}
                            onClick={() => !outOfStock && setSelectedVariantId(e.node.id)}
                            disabled={outOfStock}
                            className={`px-4 py-2 border-4 border-ink font-bold transition-all relative ${
                              selectedVariantId === e.node.id
                                ? "bg-magenta text-cream"
                                : outOfStock
                                  ? "bg-ink/10 text-ink/40 cursor-not-allowed line-through"
                                  : "bg-cream hover:bg-acid-yellow"
                            }`}
                          >
                            {e.node.selectedOptions[0]?.value || e.node.title}
                            {outOfStock && (
                              <span className="sr-only"> — sold out</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Inventory urgency — show when selected variant has limited stock */}
                    {variant && variant.availableForSale && (() => {
                      const qty = variant.quantityAvailable;
                      if (qty != null && qty > 0 && qty <= 5) {
                        return (
                          <p className="font-display text-magenta text-xs uppercase tracking-widest mt-3 animate-pulse">
                            ⚡ Only {qty} left in this size
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                <Button
                  onClick={() =>
                    variant &&
                    addItem({
                      product: { node: product },
                      variantId: variant.id,
                      variantTitle: variant.title,
                      price: variant.price,
                      quantity: 1,
                      selectedOptions: variant.selectedOptions || [],
                    })
                  }
                  disabled={!variant || !variant.availableForSale || isLoading}
                  size="lg"
                  className="w-full md:w-auto bg-ink text-cream border-4 border-ink hover:bg-magenta px-12 mb-8"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : !variant?.availableForSale ? "SOLD OUT" : "ADD TO CART"}
                </Button>

                <div className="flex flex-wrap items-center gap-3 mt-8">
                  <span className="font-display text-sm text-ink/60">SHARE:</span>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-cream text-ink font-display text-sm px-3 py-1 border-2 border-ink hover:bg-acid-yellow transition-colors"
                  >
                    WHATSAPP
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-cream text-ink font-display text-sm px-3 py-1 border-2 border-ink hover:bg-acid-yellow transition-colors"
                  >
                    X
                  </a>
                  <button
                    onClick={() => navigator.clipboard?.writeText(shareUrl)}
                    className="bg-cream text-ink font-display text-sm px-3 py-1 border-2 border-ink hover:bg-acid-yellow transition-colors"
                  >
                    COPY LINK
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Internal linking — more from CCD */}
        <section className="border-t-4 border-ink bg-acid-yellow py-12 md:py-16">
          <div className="container">
            <p className="font-display text-magenta text-base md:text-lg mb-4">/ MORE FROM CATS CAN DANCE</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Link href="/shop" className="block bg-cream border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform">
                <p className="font-display text-ink text-2xl mb-1">SEE ALL CCD STREETWEAR →</p>
                <p className="text-ink/70 text-sm font-medium">Limited drops, no restocks. Bangalore-made.</p>
              </Link>
              <Link href="/pets" className="block bg-cream border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform">
                <p className="font-display text-ink text-2xl mb-1">PET DROPS & TREATS →</p>
                <p className="text-ink/70 text-sm font-medium">Cat bandanas, bucket hats, CCD treats.</p>
              </Link>
              <Link href="/events" className="block bg-cream border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform">
                <p className="font-display text-ink text-2xl mb-1">UPCOMING EPISODES →</p>
                <p className="text-ink/70 text-sm font-medium">RSVP an underground night in Bangalore.</p>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default ProductDetail;
