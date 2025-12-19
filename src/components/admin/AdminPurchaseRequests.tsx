import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface PurchaseRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tool_type: string;
  brand: string | null;
  quantity: number;
  condition: string;
  description: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Nieuw', variant: 'default' },
  contacted: { label: 'Contact opgenomen', variant: 'secondary' },
  accepted: { label: 'Geaccepteerd', variant: 'outline' },
  rejected: { label: 'Afgewezen', variant: 'destructive' },
};

export function AdminPurchaseRequests() {
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-purchase-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PurchaseRequest[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status?: string; notes?: string }) => {
      const update: any = {};
      if (status) update.status = status;
      if (notes !== undefined) update.notes = notes;
      
      const { error } = await supabase.from('purchase_requests').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchase-requests'] });
      toast.success('Aanvraag bijgewerkt');
    },
  });

  const handleView = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setNotes(request.notes || '');
  };

  const handleSaveNotes = () => {
    if (selectedRequest) {
      updateMutation.mutate({ id: selectedRequest.id, notes });
    }
  };

  const conditionLabels: Record<string, string> = {
    nieuw: 'Nieuw',
    gebruikt: 'Gebruikt',
    defect: 'Defect',
    onbekend: 'Onbekend',
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Inkoop Aanvragen</h1>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Gereedschap</TableHead>
              <TableHead>Conditie</TableHead>
              <TableHead>Aantal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="w-[100px]">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Laden...
                </TableCell>
              </TableRow>
            ) : requests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Geen inkoop aanvragen gevonden
                </TableCell>
              </TableRow>
            ) : (
              requests?.map((request) => {
                const status = statusConfig[request.status] || statusConfig.pending;
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.name}</p>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.tool_type}</p>
                        {request.brand && (
                          <p className="text-sm text-muted-foreground">{request.brand}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{conditionLabels[request.condition] || request.condition}</TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>
                      <Select
                        value={request.status}
                        onValueChange={(v) => updateMutation.mutate({ id: request.id, status: v })}
                      >
                        <SelectTrigger className="w-[160px]">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(request.created_at), 'dd MMM yyyy', { locale: nl })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleView(request)}>
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

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inkoop Aanvraag Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedRequest.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <a href={`mailto:${selectedRequest.email}`} className="text-primary hover:underline">
                      {selectedRequest.email}
                    </a>
                  </div>
                  {selectedRequest.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <a href={`tel:${selectedRequest.phone}`} className="text-primary hover:underline">
                        {selectedRequest.phone}
                      </a>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Gereedschap</p>
                  <p className="font-medium">{selectedRequest.tool_type}</p>
                  {selectedRequest.brand && <p>Merk: {selectedRequest.brand}</p>}
                  <p>Aantal: {selectedRequest.quantity}</p>
                  <p>Conditie: {conditionLabels[selectedRequest.condition]}</p>
                </div>
              </div>

              {selectedRequest.description && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Beschrijving</p>
                  <p className="bg-muted p-3 rounded-md mt-1">{selectedRequest.description}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label htmlFor="notes">Interne notities</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Voeg notities toe..."
                  rows={3}
                  className="mt-2"
                />
                <Button onClick={handleSaveNotes} className="mt-2" disabled={updateMutation.isPending}>
                  Notities Opslaan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
