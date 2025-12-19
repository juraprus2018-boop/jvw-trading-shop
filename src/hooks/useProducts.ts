import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  condition: string;
  brand: string | null;
  stock: number;
  category_id: string | null;
  images: string[];
  featured: boolean;
  active: boolean;
  created_at: string;
  categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export function useProducts(filters?: {
  category?: string;
  condition?: string;
  search?: string;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(id, name, slug)')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.category)
          .maybeSingle();
        
        if (cat) {
          query = query.eq('category_id', cat.id);
        }
      }

      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }

      if (filters?.featured) {
        query = query.eq('featured', true);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name, slug)')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });
}
