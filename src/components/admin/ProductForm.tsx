import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCategories } from '@/hooks/useProducts';

const productSchema = z.object({
  name: z.string().min(2, 'Naam is verplicht'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Prijs moet groter dan 0 zijn'),
  originalPrice: z.number().optional(),
  condition: z.enum(['nieuw', 'gebruikt', 'gereviseerd']),
  brand: z.string().optional(),
  stock: z.number().min(0),
  categoryId: z.string().optional(),
  featured: z.boolean(),
  active: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: any;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, loading }: ProductFormProps) {
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price ? Number(product.price) : 0,
      originalPrice: product?.original_price ? Number(product.original_price) : undefined,
      condition: product?.condition || 'nieuw',
      brand: product?.brand || '',
      stock: product?.stock || 0,
      categoryId: product?.category_id || '',
      featured: product?.featured || false,
      active: product?.active !== false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Productnaam *</Label>
          <Input id="name" {...register('name')} placeholder="Bijv. Makita Boormachine" />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="brand">Merk</Label>
          <Input id="brand" {...register('brand')} placeholder="Bijv. Makita" />
        </div>

        <div>
          <Label>Categorie</Label>
          <Select value={watch('categoryId')} onValueChange={(v) => setValue('categoryId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecteer categorie" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="price">Prijs (€) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
        </div>

        <div>
          <Label htmlFor="originalPrice">Originele prijs (€)</Label>
          <Input
            id="originalPrice"
            type="number"
            step="0.01"
            {...register('originalPrice', { valueAsNumber: true })}
            placeholder="Voor kortingsweergave"
          />
        </div>

        <div>
          <Label>Conditie *</Label>
          <Select value={watch('condition')} onValueChange={(v: any) => setValue('condition', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nieuw">Nieuw</SelectItem>
              <SelectItem value="gebruikt">Gebruikt</SelectItem>
              <SelectItem value="gereviseerd">Gereviseerd</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="stock">Voorraad *</Label>
          <Input
            id="stock"
            type="number"
            {...register('stock', { valueAsNumber: true })}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Beschrijving</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Productbeschrijving..."
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="featured"
            checked={watch('featured')}
            onCheckedChange={(v) => setValue('featured', v)}
          />
          <Label htmlFor="featured" className="cursor-pointer">Uitgelicht product</Label>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="active"
            checked={watch('active')}
            onCheckedChange={(v) => setValue('active', v)}
          />
          <Label htmlFor="active" className="cursor-pointer">Product actief</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {product ? 'Opslaan' : 'Toevoegen'}
        </Button>
      </div>
    </form>
  );
}
