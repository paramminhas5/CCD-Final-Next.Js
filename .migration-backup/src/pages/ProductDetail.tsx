import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PRODUCT_BY_HANDLE_QUERY, storefrontApiRequest } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CartDrawer } from "@/components/CartDrawer";

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

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
        <section className="container py-16 md:py-24 relative">
          <div className="absolute top-8 right-4 md:right-8 z-10">
            <CartDrawer />
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 mb-8 font-bold hover:text-magenta">
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
                  <div className="mb-8">
                    <p className="font-bold mb-3">{product.options[0].name.toUpperCase()}</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.edges.map((e: any) => (
                        <button
                          key={e.node.id}
                          onClick={() => setSelectedVariantId(e.node.id)}
                          className={`px-4 py-2 border-4 border-ink font-bold transition-all ${
                            selectedVariantId === e.node.id
                              ? "bg-magenta text-cream"
                              : "bg-cream hover:bg-acid-yellow"
                          }`}
                        >
                          {e.node.selectedOptions[0]?.value || e.node.title}
                        </button>
                      ))}
                    </div>
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
                  disabled={!variant || isLoading}
                  size="lg"
                  className="w-full md:w-auto bg-ink text-cream border-4 border-ink hover:bg-magenta px-12"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ADD TO CART"}
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
              <Link to="/shop" className="block bg-cream border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform">
                <p className="font-display text-ink text-2xl mb-1">SEE ALL CCD STREETWEAR →</p>
                <p className="text-ink/70 text-sm font-medium">Limited drops, no restocks. Bangalore-made.</p>
              </Link>
              <Link to="/pets" className="block bg-cream border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform">
                <p className="font-display text-ink text-2xl mb-1">PET DROPS & TREATS →</p>
                <p className="text-ink/70 text-sm font-medium">Cat bandanas, bucket hats, CCD treats.</p>
              </Link>
              <Link to="/events" className="block bg-cream border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform">
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
