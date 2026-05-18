import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShopifyProduct, STOREFRONT_QUERY, storefrontApiRequest } from "@/lib/shopify";
import { ArrowRight } from "lucide-react";

const isPet = (p: ShopifyProduct) => {
  const t = `${p.node.title}`.toLowerCase();
  return t.includes("pet ") || t.includes("collar") || t.includes("bandana") || t.includes("leash") || t.includes("harness");
};

const ProductTile = ({ p }: { p: ShopifyProduct }) => {
  const img = p.node.images.edges[0]?.node;
  return (
    <Link
      to={`/product/${p.node.handle}`}
      className="border-4 border-ink chunk-shadow bg-acid-yellow overflow-hidden hover:-translate-y-1 transition-transform group block"
    >
      <div className="aspect-square bg-cream border-b-4 border-ink overflow-hidden">
        {img && (
          <img
            src={img.url}
            alt={img.altText || p.node.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-xl mb-1 line-clamp-1">{p.node.title}</h3>
        <p className="font-display text-base">
          {p.node.priceRange.minVariantPrice.currencyCode}{" "}
          {parseFloat(p.node.priceRange.minVariantPrice.amount).toFixed(2)}
        </p>
      </div>
    </Link>
  );
};

const Skeleton = () => (
  <div className="aspect-[4/5] border-4 border-ink bg-acid-yellow animate-pulse" />
);

const Drops = () => {
  const [streetwear, setStreetwear] = useState<ShopifyProduct[]>([]);
  const [pets, setPets] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    (async () => {
      const [generalRes, petsRes] = await Promise.allSettled([
        storefrontApiRequest(STOREFRONT_QUERY, { first: 12, query: "" }),
        storefrontApiRequest(STOREFRONT_QUERY, { first: 6, query: "tag:pets" }),
      ]);

      const general: ShopifyProduct[] =
        generalRes.status === "fulfilled" ? generalRes.value?.data?.products?.edges || [] : [];
      let petsList: ShopifyProduct[] =
        petsRes.status === "fulfilled" ? petsRes.value?.data?.products?.edges || [] : [];

      // Fallback: if tag:pets returned nothing, derive pets from general pool by title keywords
      if (petsList.length === 0 && general.length > 0) {
        petsList = general.filter(isPet);
      }

      const petIds = new Set(petsList.map((p) => p.node.id));
      const sw = general.filter((p) => !petIds.has(p.node.id) && !isPet(p)).slice(0, 2);

      setStreetwear(sw);
      setPets(petsList.slice(0, 2));
      setErrored(generalRes.status === "rejected" && petsRes.status === "rejected");
      setLoading(false);

      if (generalRes.status === "rejected") console.error("[drops] general query failed", generalRes.reason);
      if (petsRes.status === "rejected") console.error("[drops] pets query failed", petsRes.reason);
    })();
  }, []);

  return (
    <section id="drops" className="relative bg-cream border-b-4 border-ink py-12 md:py-20 bg-grain overflow-hidden">
      <div className="container">
        <p className="font-display text-magenta text-lg md:text-xl mb-3">/ DROPS · SHOP</p>
        <h2 className="font-display text-ink text-4xl md:text-6xl mb-3 leading-[0.9]">
          WEAR THE<br />CULTURE.
        </h2>
        <p className="font-display text-ink/70 text-base md:text-lg mb-8">Streetwear + pet drops. Limited. No restocks.</p>
        <p className="sr-only">
          Limited streetwear drops, pet merch and collectibles from Cats Can Dance — a Bangalore streetwear brand and India's leading independent drop culture label.
        </p>

        <div className="grid md:grid-cols-2 gap-10 mb-10">
          {/* STREETWEAR */}
          <div>
            <h3 className="font-display text-ink text-3xl mb-4 flex items-baseline gap-3">
              <span>STREETWEAR</span>
              <span className="text-magenta text-base">/ for humans</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {loading
                ? [0, 1].map((i) => <Skeleton key={i} />)
                : streetwear.length > 0
                  ? streetwear.map((p) => <ProductTile key={p.node.id} p={p} />)
                  : <div className="col-span-2 font-display text-ink/60">No streetwear yet.</div>}
            </div>
          </div>

          {/* PET MERCH */}
          <div>
            <h3 className="font-display text-ink text-3xl mb-4 flex items-baseline gap-3">
              <span>PET MERCH</span>
              <span className="text-magenta text-base">/ for the cats</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {loading
                ? [0, 1].map((i) => <Skeleton key={i} />)
                : pets.length > 0
                  ? pets.map((p) => <ProductTile key={p.node.id} p={p} />)
                  : <div className="col-span-2 font-display text-ink/60">Pet drops coming soon.</div>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 bg-ink text-cream font-display text-2xl px-8 py-4 border-4 border-ink chunk-shadow hover:bg-magenta transition-colors"
          >
            SHOP THE DROP <ArrowRight className="w-6 h-6" />
          </Link>
          <Link
            to="/pets"
            className="inline-flex items-center gap-2 bg-lime text-ink font-display text-base px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
          >
            SHOP PET MERCH <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Drops;
