import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

type Props = {
  product: ShopifyProduct;
  altSuffix?: string;
};

const ProductCard = ({ product, altSuffix = "Cats Can Dance limited drop" }: Props) => {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const variant = product.node.variants.edges[0]?.node;
  const img = product.node.images.edges[0]?.node;

  return (
    <article className="border-4 border-ink chunk-shadow bg-cream overflow-hidden hover:-translate-y-1 transition-transform">
      <Link to={`/product/${product.node.handle}`} className="block">
        <div className="aspect-square bg-acid-yellow border-b-4 border-ink overflow-hidden">
          {img && (
            <img
              src={img.url}
              alt={img.altText || `${product.node.title} — ${altSuffix}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </Link>
      <div className="p-5">
        <Link to={`/product/${product.node.handle}`}>
          <h3 className="font-display text-2xl mb-1 hover:text-magenta transition-colors">
            {product.node.title}
          </h3>
        </Link>
        <p className="font-display text-xl mb-4">
          {product.node.priceRange.minVariantPrice.currencyCode}{" "}
          {parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
        </p>
        <Button
          onClick={() =>
            variant &&
            addItem({
              product,
              variantId: variant.id,
              variantTitle: variant.title,
              price: variant.price,
              quantity: 1,
              selectedOptions: variant.selectedOptions || [],
            })
          }
          disabled={!variant || isLoading}
          className="w-full bg-ink text-cream border-4 border-ink hover:bg-magenta"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ADD TO CART"}
        </Button>
      </div>
    </article>
  );
};

export default ProductCard;
