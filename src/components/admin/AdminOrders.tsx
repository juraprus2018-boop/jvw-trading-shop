import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Package, Truck, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Order {
  id: string;
  email: string;
  status: string;
  total: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: any }> = {
  pending: { label: 'In afwachting', variant: 'secondary', icon: Package },
  paid: { label: 'Betaald', variant: 'default', icon: CheckCircle },
  processing: { label: 'In behandeling', variant: 'outline', icon: Package },
  shipped: { label: 'Verzonden', variant: 'default', icon: Truck },
  delivered: { label: 'Afgeleverd', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Geannuleerd', variant: 'destructive', icon: X },
};

export function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status bijgewerkt');
    },
  });

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);
    setOrderItems(data || []);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Bestellingen</h1>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bestelling</TableHead>
              <TableHead>Klant</TableHead>
              <TableHead>Totaal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="w-[100px]">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Laden...
                </TableCell>
              </TableRow>
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Geen bestellingen gevonden
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.shipping_name}</p>
                        <p className="text-sm text-muted-foreground">{order.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      €{Number(order.total).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: order.id, status: v })}
                      >
                        <SelectTrigger className="w-[160px]">
                          <Badge variant={status.variant} className="gap-1">
                            <status.icon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.created_at), 'dd MMM yyyy', { locale: nl })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bestelling #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Klant</p>
                  <p className="font-medium">{selectedOrder.shipping_name}</p>
                  <p>{selectedOrder.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Verzendadres</p>
                  <p>{selectedOrder.shipping_address}</p>
                  <p>{selectedOrder.shipping_postal} {selectedOrder.shipping_city}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="font-medium mb-2">Producten</p>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>€{(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold mt-4 pt-4 border-t">
                  <span>Totaal</span>
                  <span>€{Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
