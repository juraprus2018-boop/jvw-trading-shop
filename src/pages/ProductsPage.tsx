import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, SlidersHorizontal, ChevronDown, Grid3X3, LayoutList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts, useCategories } from '@/hooks/useProducts';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const category = searchParams.get('category') || undefined;
  const condition = searchParams.get('condition') || undefined;
  const search = searchParams.get('search') || undefined;
  const sort = searchParams.get('sort') || 'newest';

  const { data: products, isLoading } = useProducts({ category, condition, search });
  const { data: categories } = useCategories();

  // Get unique brands from products
  const brands = useMemo(() => {
    if (!products) return [];
    const brandSet = new Set(products.map(p => p.brand).filter(Boolean));
    return Array.from(brandSet).sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products.filter(p => {
      const price = Number(p.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    switch (sort) {
      case 'price-asc':
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-desc':
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  }, [products, priceRange, sort]);

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
    setPriceRange([0, 5000]);
  };

  const hasFilters = category || condition || search;
  const activeFilterCount = [category, condition, search].filter(Boolean).length;

  const conditions = [
    { value: 'nieuw', label: 'Nieuw' },
    { value: 'gebruikt', label: 'Gebruikt' },
    { value: 'gereviseerd', label: 'Gereviseerd' },
  ];

  // Sidebar Filter Component
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`space-y-6 ${isMobile ? '' : 'sticky top-24'}`}>
      {/* Categories */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold text-foreground hover:text-primary transition-colors">
          Categorieën
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-2">
          <button
            onClick={() => setFilter('category', null)}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !category ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Alle categorieën
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter('category', cat.slug)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                category === cat.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Condition */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold text-foreground hover:text-primary transition-colors">
          Conditie
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {conditions.map((cond) => (
            <div key={cond.value} className="flex items-center space-x-3">
              <Checkbox
                id={`condition-${cond.value}`}
                checked={condition === cond.value}
                onCheckedChange={(checked) => setFilter('condition', checked ? cond.value : null)}
              />
              <Label
                htmlFor={`condition-${cond.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {cond.label}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Price Range */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold text-foreground hover:text-primary transition-colors">
          Prijsbereik
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={5000}
            step={50}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="px-3 py-1 bg-muted rounded-md">€{priceRange[0]}</span>
            <span className="text-muted-foreground">tot</span>
            <span className="px-3 py-1 bg-muted rounded-md">€{priceRange[1]}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {brands.length > 0 && (
        <>
          <Separator />

          {/* Brands */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold text-foreground hover:text-primary transition-colors">
              Merken
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-2 max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center space-x-3">
                  <Checkbox id={`brand-${brand}`} />
                  <Label
                    htmlFor={`brand-${brand}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {brand}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      {/* Clear Filters */}
      {hasFilters && (
        <>
          <Separator />
          <Button variant="outline" onClick={clearFilters} className="w-full gap-2">
            <X className="h-4 w-4" />
            Wis alle filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Producten</h1>
          <p className="text-muted-foreground">
            Ontdek ons complete assortiment gereedschap
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <span className="font-semibold">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
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

              {/* Mobile Filter Button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5" />
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar isMobile />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={sort} onValueChange={(v) => setFilter('sort', v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sorteren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Nieuwste eerst</SelectItem>
                  <SelectItem value="price-asc">Prijs: laag naar hoog</SelectItem>
                  <SelectItem value="price-desc">Prijs: hoog naar laag</SelectItem>
                  <SelectItem value="name">Naam A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {search && (
                  <Badge variant="secondary" className="gap-1 px-3 py-1">
                    Zoek: {search}
                    <button onClick={() => { setFilter('search', null); setSearchInput(''); }}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {category && (
                  <Badge variant="secondary" className="gap-1 px-3 py-1">
                    {categories?.find(c => c.slug === category)?.name || category}
                    <button onClick={() => setFilter('category', null)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {condition && (
                  <Badge variant="secondary" className="gap-1 px-3 py-1">
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    <button onClick={() => setFilter('condition', null)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
                  Wis alles
                </Button>
              </div>
            )}

            {/* Results Count */}
            {!isLoading && filteredProducts && (
              <p className="text-sm text-muted-foreground mb-4">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 'en' : ''} gevonden
              </p>
            )}

            {/* Results */}
            {isLoading ? (
              <div className={`grid gap-4 md:gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className={`grid gap-4 md:gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredProducts.map((product) => (
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
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-xl">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Geen producten gevonden</h2>
                <p className="text-muted-foreground mb-4">
                  Probeer andere zoektermen of filters
                </p>
                <Button onClick={clearFilters}>Bekijk alle producten</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
