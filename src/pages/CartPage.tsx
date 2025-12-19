import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Uw winkelwagen is leeg</h1>
          <p className="text-muted-foreground mb-6">
            Voeg producten toe om te beginnen met winkelen
          </p>
          <Link to="/producten">
            <Button size="lg" className="gap-2">
              Bekijk Producten
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Winkelwagen</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-card rounded-lg border border-border"
              >
                {/* Image */}
                <div className="w-24 h-24 flex-shrink-0 rounded-md bg-muted overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl">🔧</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {item.condition}
                  </p>
                  <p className="text-lg font-bold text-primary mt-1">
                    €{item.price.toFixed(2)}
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex flex-col items-end justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-bold mb-4">Overzicht</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotaal ({totalItems} artikel{totalItems !== 1 ? 'en' : ''})
                  </span>
                  <span>€{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verzending</span>
                  <span className="text-success">Gratis</span>
                </div>
              </div>

              <div className="border-t border-border my-4" />

              <div className="flex justify-between text-lg font-bold">
                <span>Totaal</span>
                <span className="text-primary">€{totalPrice.toFixed(2)}</span>
              </div>

              <Link to="/checkout" className="block mt-6">
                <Button size="lg" className="w-full gap-2">
                  Afrekenen
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/producten" className="block mt-3">
                <Button variant="outline" className="w-full">
                  Verder winkelen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
