import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingCart, Inbox, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [products, orders, requests] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('orders').select('id, total, status', { count: 'exact' }),
        supabase.from('purchase_requests').select('id, status', { count: 'exact' }),
      ]);

      const totalRevenue = orders.data?.reduce((sum, o) => 
        o.status === 'paid' ? sum + Number(o.total) : sum, 0
      ) || 0;

      const pendingRequests = requests.data?.filter(r => r.status === 'pending').length || 0;

      return {
        products: products.count || 0,
        orders: orders.count || 0,
        requests: requests.count || 0,
        pendingRequests,
        revenue: totalRevenue,
      };
    },
  });

  const statCards = [
    {
      title: 'Totaal Producten',
      value: stats?.products || 0,
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Bestellingen',
      value: stats?.orders || 0,
      icon: ShoppingCart,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Inkoop Aanvragen',
      value: `${stats?.pendingRequests || 0} nieuw`,
      icon: Inbox,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'Omzet',
      value: `€${(stats?.revenue || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
