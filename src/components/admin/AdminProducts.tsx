import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProductForm, ProductFormData } from './ProductForm';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  condition: string;
  brand: string | null;
  stock: number;
  featured: boolean;
  active: boolean;
  categories: { name: string } | null;
}

export function AdminProducts() {
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product verwijderd');
      setDeleteProduct(null);
    },
    onError: () => {
      toast.error('Kon product niet verwijderen');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData & { id?: string }) => {
      const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      if (data.id) {
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            slug,
            description: data.description,
            price: data.price,
            original_price: data.originalPrice || null,
            condition: data.condition,
            brand: data.brand || null,
            stock: data.stock,
            category_id: data.categoryId || null,
            featured: data.featured,
            active: data.active,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert({
          name: data.name,
          slug: slug + '-' + Date.now(),
          description: data.description,
          price: data.price,
          original_price: data.originalPrice || null,
          condition: data.condition,
          brand: data.brand || null,
          stock: data.stock,
          category_id: data.categoryId || null,
          featured: data.featured,
          active: data.active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editProduct ? 'Product bijgewerkt' : 'Product toegevoegd');
      setShowForm(false);
      setEditProduct(null);
    },
    onError: () => {
      toast.error('Kon product niet opslaan');
    },
  });

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditProduct(null);
    setShowForm(true);
  };

  const conditionBadge = (condition: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      nieuw: 'default',
      gebruikt: 'secondary',
      gereviseerd: 'outline',
    };
    return <Badge variant={variants[condition] || 'secondary'}>{condition}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Producten</h1>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nieuw Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek producten..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead>Prijs</TableHead>
              <TableHead>Conditie</TableHead>
              <TableHead>Voorraad</TableHead>
              <TableHead>Status</TableHead>
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
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Geen producten gevonden
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.brand && (
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.categories?.name || '-'}</TableCell>
                  <TableCell>€{Number(product.price).toFixed(2)}</TableCell>
                  <TableCell>{conditionBadge(product.condition)}</TableCell>
                  <TableCell>
                    <span className={product.stock <= 0 ? 'text-destructive' : ''}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {product.featured && <Badge variant="outline">Uitgelicht</Badge>}
                      {!product.active && <Badge variant="destructive">Inactief</Badge>}
                      {product.active && !product.featured && <Badge variant="secondary">Actief</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteProduct(product)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? 'Product Bewerken' : 'Nieuw Product'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editProduct}
            onSubmit={(data) => saveMutation.mutate({ ...data, id: editProduct?.id })}
            onCancel={() => {
              setShowForm(false);
              setEditProduct(null);
            }}
            loading={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Product verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je "{deleteProduct?.name}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
