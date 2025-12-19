import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const checkoutSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  name: z.string().min(2, 'Naam is verplicht'),
  address: z.string().min(5, 'Adres is verplicht'),
  city: z.string().min(2, 'Stad is verplicht'),
  postal: z.string().min(4, 'Postcode is verplicht'),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Uw winkelwagen is leeg</h1>
          <Link to="/producten">
            <Button>Bekijk Producten</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const onSubmit = async (data: CheckoutForm) => {
    setLoading(true);

    try {
      // Create the checkout session via edge function
      const { data: session, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          shipping: {
            name: data.name,
            email: data.email,
            address: data.address,
            city: data.city,
            postal: data.postal,
          },
        },
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (session?.url) {
        window.location.href = session.url;
      } else {
        throw new Error('Geen checkout URL ontvangen');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Er ging iets mis bij het afrekenen. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <Link
          to="/winkelwagen"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar winkelwagen
        </Link>

        <h1 className="text-3xl font-bold mb-8">Afrekenen</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Verzendgegevens</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mailadres</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="uw@email.nl"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Volledige naam</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Jan Jansen"
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="Straatnaam 123"
                />
                {errors.address && (
                  <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal">Postcode</Label>
                  <Input
                    id="postal"
                    {...register('postal')}
                    placeholder="1234 AB"
                  />
                  {errors.postal && (
                    <p className="text-sm text-destructive mt-1">{errors.postal.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="city">Stad</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="Amsterdam"
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 mt-6"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Betalen met Stripe
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                U wordt doorgestuurd naar Stripe voor veilige betaling via iDEAL of creditcard.
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Uw Bestelling</h2>
            <div className="bg-card rounded-lg border border-border p-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 flex-shrink-0 rounded bg-muted overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🔧
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Aantal: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    €{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotaal</span>
                  <span>€{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verzending</span>
                  <span className="text-success">Gratis</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>Totaal</span>
                  <span className="text-primary">€{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
