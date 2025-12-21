import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Package, Loader2, ShoppingBag, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal: string;
  order_items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  pending: 'In afwachting',
  paid: 'Betaald',
  processing: 'In behandeling',
  shipped: 'Verzonden',
  delivered: 'Afgeleverd',
  cancelled: 'Geannuleerd',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  paid: 'bg-green-500/10 text-green-600 border-green-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    async function fetchOrders() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            status,
            total,
            shipping_name,
            shipping_address,
            shipping_city,
            shipping_postal,
            order_items (
              id,
              product_name,
              quantity,
              price
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Mijn Bestellingen</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nog geen bestellingen</h2>
              <p className="text-muted-foreground mb-6">
                Je hebt nog geen bestellingen geplaatst.
              </p>
              <Link to="/producten">
                <Button>Bekijk Producten</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <CardTitle className="text-base font-medium">
                        Bestelling #{order.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={statusColors[order.status] || 'bg-muted'}
                      >
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'd MMMM yyyy', { locale: nl })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{item.quantity}x</span>
                            <span>{item.product_name}</span>
                          </div>
                          <span className="font-medium">
                            €{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t gap-4">
                      <div className="text-sm text-muted-foreground">
                        <span>Verzonden naar: </span>
                        <span className="text-foreground">
                          {order.shipping_city}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground">Totaal: </span>
                          <span className="text-lg font-bold">€{Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
