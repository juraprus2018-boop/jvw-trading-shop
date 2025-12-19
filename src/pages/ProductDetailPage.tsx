import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Truck, Shield, RotateCcw, Package, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { ProductCard } from '@/components/products/ProductCard';
import { ImageGallery } from '@/components/products/ImageGallery';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: relatedProducts } = useProducts({ category: product?.categories?.slug });
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      condition: product.condition,
      image: product.images?.[0],
    });
    toast.success(`${product.name} toegevoegd aan winkelwagen`);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="aspect-square bg-muted animate-pulse rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product niet gevonden</h1>
          <Link to="/producten">
            <Button>Terug naar producten</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const conditionLabel = {
    nieuw: 'Nieuw',
    gebruikt: 'Gebruikt',
    gereviseerd: 'Gereviseerd',
  }[product.condition] || product.condition;

  const conditionClass = {
    nieuw: 'tool-badge-new',
    gebruikt: 'tool-badge-used',
    gereviseerd: 'tool-badge-refurbished',
  }[product.condition] || 'tool-badge-used';

  const discount = product.original_price && Number(product.original_price) > Number(product.price)
    ? Math.round((1 - Number(product.price) / Number(product.original_price)) * 100)
    : null;

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <Link
          to="/producten"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar producten
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <ImageGallery 
            images={product.images || []} 
            productName={product.name} 
          />

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.brand && (
                <p className="text-sm font-medium text-primary uppercase tracking-wide mb-1">
                  {product.brand}
                </p>
              )}
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">{product.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={conditionClass}>{conditionLabel}</span>
                {product.categories && (
                  <Link
                    to={`/producten?category=${product.categories.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {product.categories.name}
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                €{Number(product.price).toFixed(2)}
              </span>
              {discount && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    €{Number(product.original_price).toFixed(2)}
                  </span>
                  <span className="bg-destructive/10 text-destructive text-sm font-semibold px-2 py-1 rounded">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground text-lg leading-relaxed">{product.description}</p>
            )}

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 text-sm font-medium ${
                  product.stock > 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    product.stock > 0 ? 'bg-success' : 'bg-destructive'
                  }`}
                />
                {product.stock > 0 ? `${product.stock} op voorraad` : 'Uitverkocht'}
              </span>
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 gap-2 h-14 text-lg"
              >
                <ShoppingCart className="h-5 w-5" />
                In Winkelwagen
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium">Snelle levering</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium">Kwaliteitsgarantie</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium">14 dagen retour</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.filter(p => p.id !== product.id).length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Gerelateerde Producten</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts
                .filter((p) => p.id !== product.id)
                .slice(0, 4)
                .map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    slug={p.slug}
                    price={Number(p.price)}
                    originalPrice={p.original_price ? Number(p.original_price) : undefined}
                    condition={p.condition}
                    brand={p.brand || undefined}
                    image={p.images?.[0]}
                  />
                ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
