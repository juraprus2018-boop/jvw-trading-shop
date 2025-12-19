import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts, useCategories } from '@/hooks/useProducts';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const category = searchParams.get('category') || undefined;
  const condition = searchParams.get('condition') || undefined;
  const search = searchParams.get('search') || undefined;

  const { data: products, isLoading } = useProducts({ category, condition, search });
  const { data: categories } = useCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput) {
      searchParams.set('search', searchInput);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const setFilter = (key: string, value: string | null) => {
    if (value && value !== 'all') {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchInput('');
  };

  const hasFilters = category || condition || search;

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Producten</h1>
          <p className="text-muted-foreground">
            Ontdek ons complete assortiment gereedschap
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek producten..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Zoeken</Button>
          </form>

          {/* Category Filter */}
          <Select value={category || 'all'} onValueChange={(v) => setFilter('category', v)}>
            <SelectTrigger className="w-full lg:w-[200px]">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle categorieën</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Condition Filter */}
          <Select value={condition || 'all'} onValueChange={(v) => setFilter('condition', v)}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Conditie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle condities</SelectItem>
              <SelectItem value="nieuw">Nieuw</SelectItem>
              <SelectItem value="gebruikt">Gebruikt</SelectItem>
              <SelectItem value="gereviseerd">Gereviseerd</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Wis filters
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Zoek: {search}
                <button onClick={() => setFilter('search', null)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {categories?.find(c => c.slug === category)?.name || category}
                <button onClick={() => setFilter('category', null)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {condition && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {condition.charAt(0).toUpperCase() + condition.slice(1)}
                <button onClick={() => setFilter('condition', null)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {products.length} product{products.length !== 1 ? 'en' : ''} gevonden
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={Number(product.price)}
                  originalPrice={product.original_price ? Number(product.original_price) : undefined}
                  condition={product.condition}
                  brand={product.brand || undefined}
                  image={product.images?.[0]}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen producten gevonden</h2>
            <p className="text-muted-foreground mb-4">
              Probeer andere zoektermen of filters
            </p>
            <Button onClick={clearFilters}>Bekijk alle producten</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
