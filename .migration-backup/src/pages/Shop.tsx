import { useEffect, useMemo, useState } from "react";
import { ShopifyProduct, STOREFRONT_QUERY, storefrontApiRequest } from "@/lib/shopify";
import { Loader2 } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CartDrawer } from "@/components/CartDrawer";
import PageHero from "@/components/PageHero";
import ProductCard from "@/components/ProductCard";

type Filter = "ALL" | "STREETWEAR" | "PETS";

const Shop = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    (async () => {
      try {
        const data = await storefrontApiRequest(STOREFRONT_QUERY, { first: 30, query: null });
        setProducts(data?.data?.products?.edges || []);
      } catch (e) {
        console.error("Failed to load products:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isPet = (p: ShopifyProduct) =>
    p.node.productType === "Pet" || (p.node.tags || []).some((t) => t.toLowerCase() === "pets" || t.toLowerCase() === "pet");

  const filtered = useMemo(() => {
    if (filter === "ALL") return products;
    if (filter === "PETS") return products.filter(isPet);
    return products.filter((p) => !isPet(p));
  }, [filter, products]);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Cats Can Dance — Limited Streetwear Drops, Pet Streetwear & Music Collectibles",
    description:
      "Limited streetwear drops, cat-graphic apparel, pet streetwear (cat bandanas, bucket hats, treats) and music collectibles from Cats Can Dance — a Bangalore brand.",
    url: "https://catscandance.com/shop",
    inLanguage: "en-IN",
    isPartOf: { "@type": "WebSite", name: "Cats Can Dance", url: "https://catscandance.com" },
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: filtered.length,
    itemListElement: filtered.slice(0, 30).map((p, i) => {
      const variant = p.node.variants.edges[0]?.node;
      const image = p.node.images.edges[0]?.node?.url;
      return {
        "@type": "ListItem",
        position: i + 1,
        url: `https://catscandance.com/product/${p.node.handle}`,
        item: {
          "@type": "Product",
          name: p.node.title,
          url: `https://catscandance.com/product/${p.node.handle}`,
          image,
          brand: { "@type": "Brand", name: "Cats Can Dance" },
          category: p.node.productType || "Streetwear",
          offers: variant
            ? {
                "@type": "Offer",
                price: variant.price.amount,
                priceCurrency: variant.price.currencyCode,
                availability: "https://schema.org/InStock",
                url: `https://catscandance.com/product/${p.node.handle}`,
              }
            : undefined,
        },
      };
    }),
  };

  return (
    <>
      <SEO
        title="Apparel, Limited Drops & CCD Goods | Cats Can Dance"
        description="Tees, totes, accessories. Limited apparel drops and CCD goods from Bangalore's dance crew."
        path="/shop"
        jsonLd={[collectionLd, ...(filtered.length ? [itemListLd] : [])]}
      />
      <main className="bg-cream text-ink">
        <Nav />
        <PageHero eyebrow="SHOP" title="DROPS & COLLECTIBLES." bg="bg-magenta" eyebrowColor="text-acid-yellow">
          <p className="font-display text-cream text-2xl mt-4">
            Streetwear & pet streetwear. Made for the floor in Bangalore.
          </p>
        </PageHero>

        <section className="container py-16 md:py-24 relative">
          <div className="absolute top-8 right-4 md:right-8 z-10">
            <CartDrawer />
          </div>

          <h1 className="sr-only">
            Cats Can Dance Shop — streetwear drops, pet streetwear & music collectibles in Bangalore, India
          </h1>
          <p className="sr-only">
            Browse the current Cats Can Dance drop. Heavyweight streetwear, plus pet streetwear including
            cat bandanas, cat bucket hats, and CCD cat treats. Screen-printed in Bangalore. Limited quantities.
          </p>

          {/* FILTER CHIPS */}
          <div className="flex flex-wrap gap-3 mb-8">
            {(["ALL", "STREETWEAR", "PETS"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-display text-base md:text-lg px-5 py-2 border-4 border-ink chunk-shadow transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                  filter === f ? "bg-ink text-cream" : "bg-cream text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32 border-4 border-ink chunk-shadow bg-cream">
              <p className="font-display text-3xl mb-2">NO PRODUCTS YET</p>
              <p className="text-muted-foreground">Drop incoming.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-8">
              {filtered.map((p) => (
                <ProductCard key={p.node.id} product={p} />
              ))}
            </div>
          )}
        </section>
        <Footer />
      </main>
    </>
  );
};

export default Shop;
