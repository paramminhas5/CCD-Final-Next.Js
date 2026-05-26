import { useEffect, useState } from "react";
import { ShopifyProduct, STOREFRONT_QUERY, storefrontApiRequest } from "@/lib/shopify";
import { Loader2 } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CartDrawer } from "@/components/CartDrawer";
import PageHero from "@/components/PageHero";
import ProductCard from "@/components/ProductCard";

const Pets = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await storefrontApiRequest(STOREFRONT_QUERY, { first: 30, query: "tag:pets" });
        setProducts(data?.data?.products?.edges || []);
      } catch (e) {
        console.error("Failed to load pet products:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pet Streetwear in India — Cat Bandanas, Bucket Hats & Cat Treats | Cats Can Dance",
    description:
      "Pet streetwear from Cats Can Dance — cat bandanas, cat bucket hats and CCD cat treats. Made in Bangalore, India.",
    url: "https://catscandance.com/pets",
    inLanguage: "en-IN",
    isPartOf: { "@type": "WebSite", name: "Cats Can Dance", url: "https://catscandance.com" },
  };

  const brandLd = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: "Cats Can Dance",
    slogan: "Pet streetwear that actually fits.",
    url: "https://catscandance.com",
    logo: "https://catscandance.com/ccd-logo.png",
    category: "Pet Products",
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => {
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
          category: "Pet Products",
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
        title="Pet Streetwear & Products | Cats Can Dance Bangalore"
        description="Cat bandanas, bucket hats, treats. Cool culture & streetwear, made for cats who party."
        path="/pets"
        jsonLd={[collectionLd, brandLd, ...(products.length ? [itemListLd] : [])]}
      />
      <main className="bg-cream text-ink">
        <Nav />
        <PageHero eyebrow="PETS" title="PETS THAT PARTY." bg="bg-electric-blue" eyebrowColor="text-acid-yellow">
          <p className="font-display text-cream text-2xl mt-4">
            Apparel & pet products — CCD-branded, made for the floor.
          </p>
        </PageHero>

        <section className="container py-16 md:py-24 relative">
          <div className="absolute top-8 right-4 md:right-8 z-10">
            <CartDrawer />
          </div>

          <h1 className="sr-only">
            Pet streetwear in India — cat bandanas, bucket hats & cat treats from Bangalore
          </h1>
          <p className="sr-only">
            Cats Can Dance pet streetwear is designed in Bangalore, India. Shop cat bandanas, cat bucket
            hats and CCD cat treats. Limited drops, no restocks. Buy pet streetwear, cat bandana India,
            pet bucket hat and cat treats Bangalore — all from the same brand that runs the Episodes.
          </p>

          <h2 className="font-display text-3xl md:text-5xl mb-2">
            Pet streetwear made in Bangalore.
          </h2>
          <p className="text-ink/80 text-lg max-w-2xl mb-10">
            Cat bandanas, bucket hats and treats. Designed for cats who party.
          </p>

          {loading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-32 border-4 border-ink chunk-shadow bg-cream">
              <p className="font-display text-3xl mb-2">NO PET PRODUCTS YET</p>
              <p className="text-muted-foreground">Drop incoming.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-8">
              {products.map((p) => (
                <ProductCard key={p.node.id} product={p} altSuffix="Cats Can Dance pet streetwear Bangalore" />
              ))}
            </div>
          )}

          <div className="mt-16 border-4 border-ink chunk-shadow bg-acid-yellow p-8">
            <h2 className="font-display text-2xl md:text-3xl mb-3">FAQ — PET STREETWEAR INDIA</h2>
            <dl className="space-y-4 text-ink">
              <div>
                <dt className="font-display text-lg">Where can I buy cat bandanas in Bangalore?</dt>
                <dd className="font-medium text-ink/80">Right here. Cats Can Dance ships cat bandanas across India from Bangalore.</dd>
              </div>
              <div>
                <dt className="font-display text-lg">Are CCD cat treats safe for kittens?</dt>
                <dd className="font-medium text-ink/80">Our treats are small-batch made for adult cats. Check ingredients on the product page.</dd>
              </div>
              <div>
                <dt className="font-display text-lg">Do you restock pet bucket hats?</dt>
                <dd className="font-medium text-ink/80">No restocks. Each pet streetwear drop is limited.</dd>
              </div>
            </dl>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
};

export default Pets;
