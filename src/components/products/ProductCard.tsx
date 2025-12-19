import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  condition: string;
  brand?: string;
  image?: string;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  originalPrice,
  condition,
  brand,
  image,
}: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id,
      name,
      price,
      condition,
      image,
    });
    toast.success(`${name} toegevoegd aan winkelwagen`);
  };

  const conditionLabel = {
    nieuw: 'Nieuw',
    gebruikt: 'Gebruikt',
    gereviseerd: 'Gereviseerd',
  }[condition] || condition;

  const conditionClass = {
    nieuw: 'tool-badge-new',
    gebruikt: 'tool-badge-used',
    gereviseerd: 'tool-badge-refurbished',
  }[condition] || 'tool-badge-used';

  return (
    <Link to={`/product/${slug}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-4xl text-muted-foreground">🔧</span>
            </div>
          )}
          <span className={`absolute top-2 left-2 ${conditionClass}`}>
            {conditionLabel}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="absolute top-2 right-2 tool-badge bg-destructive text-destructive-foreground">
              -{Math.round((1 - price / originalPrice) * 100)}%
            </span>
          )}
        </div>
        <CardContent className="p-4">
          {brand && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {brand}
            </p>
          )}
          <h3 className="mt-1 font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">
                €{price.toFixed(2)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-muted-foreground line-through">
                  €{originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <Button
              size="icon"
              variant="secondary"
              onClick={handleAddToCart}
              className="h-8 w-8 shrink-0"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
