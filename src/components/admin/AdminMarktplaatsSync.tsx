import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, ExternalLink, Package, Download, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface MarktplaatsListing {
  title: string;
  price: string;
  url: string;
  image: string | null;
  description: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Keyword mappings for automatic categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  zaagmachines: [
    'zaag', 'zaagtafel', 'cirkelzaag', 'decoupeerzaag', 'verstekzaag',
    'kettingzaag', 'afkortzaag', 'lintzaag', 'figuurzaag', 'reciprozaag',
  ],
  'elektrisch-gereedschap': [
    'boormachine', 'boor', 'slijptol', 'schuurmachine', 'haakse slijper',
    'accuschroef', 'klopboor', 'freesmachine', 'polijstmachine', 'heteluchtpistool',
    'decoupeerzaag', 'elektrisch', 'accu', 'oplader', 'multitool',
  ],
  handgereedschap: [
    'hamer', 'tang', 'schroevendraaier', 'moersleutel', 'sleutelset', 'steeksleutel',
    'ringsleutel', 'waterpomptang', 'kniptang', 'combinatietang', 'nijptang',
    'meetlint', 'waterpas', 'beitel', 'vijl', 'rasp', 'schaaf', 'handzaag',
  ],
  machines: [
    'machine', 'compressor', 'generator', 'lasapparaat', 'lasmachine',
    'draaibank', 'freesbank', 'pers', 'tafel', 'werkbank', 'statief',
  ],
  'bouw-verbouw': [
    'bouw', 'verbouw', 'isolatie', 'kit', 'lijm', 'mortelmixer',
    'tegelsnijder', 'tegels', 'afvoer', 'drainage', 'infiltratie', 'buizen',
    'pvc', 'koppeling', 'afdichting', 'cement', 'beton',
  ],
  accessoires: [
    'bit', 'boor', 'schijf', 'blad', 'zaagblad', 'schuurpapier',
    'schuurschijf', 'doorslijpschijf', 'diamant', 'spijker', 'schroef',
    'plug', 'set', 'koffer', 'opbergbox',
  ],
  'tuin-buiten': [
    'tuin', 'grasmaaier', 'heggenschaar', 'bladblazer', 'snoeischaar',
    'tuinslang', 'sproeier', 'hogedruk', 'terras', 'bestrating',
  ],
};

/**
 * Determines the best category for a listing based on title and description keywords.
 */
function detectCategory(
  listing: MarktplaatsListing,
  categories: Category[]
): Category | null {
  const textToSearch = `${listing.title} ${listing.description ?? ''}`.toLowerCase();

  let bestMatch: { category: Category; score: number } | null = null;

  for (const category of categories) {
    const keywords = CATEGORY_KEYWORDS[category.slug];
    if (!keywords) continue;

    let score = 0;
    for (const keyword of keywords) {
      if (textToSearch.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category, score };
    }
  }

  // Fall back to "Overig" if no keywords match
  if (!bestMatch) {
    const fallback = categories.find((c) => c.slug === 'overig');
    return fallback ?? null;
  }

  return bestMatch.category;
}

export function AdminMarktplaatsSync() {
  const [profileUrl, setProfileUrl] = useState('https://www.marktplaats.nl/u/job/26215563/');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importingIndex, setImportingIndex] = useState<number | null>(null);
  const [listings, setListings] = useState<MarktplaatsListing[]>([]);
  const [importedUrls, setImportedUrls] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const queryClient = useQueryClient();

  // Load categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleSync = async () => {
    if (!profileUrl) {
      toast.error('Voer een Marktplaats profiel URL in');
      return;
    }

    setIsLoading(true);
    setListings([]);
    setImportedUrls(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('scrape-marktplaats', {
        body: { profileUrl },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Onbekende fout');
      }

      setListings(data.listings || []);
      
      if (data.listings?.length > 0) {
        toast.success(`${data.listings.length} listings gevonden!`);
      } else {
        toast.info('Geen listings gevonden');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Sync mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const importListing = async (
    listing: MarktplaatsListing
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Create a slug from the title
      const slugBase = listing.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      const slug = `${slugBase || 'product'}-${Date.now()}`;

      // Parse price to number
      const priceNum =
        parseFloat(listing.price.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

      // Detect category
      const detectedCategory = detectCategory(listing, categories);

      const { error } = await supabase.from('products').insert({
        name: listing.title,
        slug,
        description: listing.description || `Geïmporteerd van Marktplaats: ${listing.url}`,
        price: priceNum,
        condition: 'gebruikt',
        stock: 1,
        images: listing.image ? [listing.image] : [],
        active: true,
        featured: false,
        category_id: detectedCategory?.id ?? null,
        source_url: listing.url,
      } as any);

      if (error) {
        console.error('Error importing:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Onbekende fout';
      console.error('Import failed:', error);
      return { success: false, error: message };
    }
  };

  const handleImportListing = async (listing: MarktplaatsListing, index: number) => {
    if (importedUrls.has(listing.url)) {
      toast.info('Dit product is al geïmporteerd');
      return;
    }

    setImportingIndex(index);

    const result = await importListing(listing);

    if (result.success) {
      setImportedUrls((prev) => new Set(prev).add(listing.url));
      toast.success(`"${listing.title}" geïmporteerd!`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } else {
      toast.error(
        `Importeren van "${listing.title}" mislukt${result.error ? `: ${result.error}` : ''}`
      );
    }

    setImportingIndex(null);
  };

  const handleImportAll = async () => {
    const toImport = listings.filter((l) => !importedUrls.has(l.url));

    if (toImport.length === 0) {
      toast.info('Alle producten zijn al geïmporteerd');
      return;
    }

    setIsImporting(true);
    let imported = 0;
    let firstError: string | undefined;

    for (const listing of toImport) {
      const result = await importListing(listing);
      if (result.success) {
        imported++;
        setImportedUrls((prev) => new Set(prev).add(listing.url));
      } else {
        firstError ||= result.error;
      }
      // Small delay between imports
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsImporting(false);
    queryClient.invalidateQueries({ queryKey: ['products'] });

    if (imported > 0) {
      toast.success(`${imported} producten geïmporteerd!`);
    } else {
      toast.error(`Geen producten konden worden geïmporteerd${firstError ? `: ${firstError}` : ''}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Marktplaats Synchronisatie
          </CardTitle>
          <CardDescription>
            Synchroniseer je Marktplaats listings met je webshop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.marktplaats.nl/u/username/12345/"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSync} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Bezig...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Nu
                </>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>

      {listings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gevonden Listings ({listings.length})</CardTitle>
                <CardDescription>
                  {importedUrls.size > 0 
                    ? `${importedUrls.size} van ${listings.length} geïmporteerd`
                    : 'Selecteer welke listings je wilt importeren'}
                </CardDescription>
              </div>
              <Button 
                onClick={handleImportAll} 
                disabled={isImporting || importedUrls.size === listings.length}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importeren...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Alles Importeren
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {listings.map((listing, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    importedUrls.has(listing.url) ? 'bg-muted/50 opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {listing.image && (
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{listing.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {listing.price && (
                          <span className="text-sm text-accent font-semibold">{listing.price}</span>
                        )}
                        {(() => {
                          const cat = detectCategory(listing, categories);
                          return cat ? (
                            <Badge variant="secondary" className="text-xs">
                              {cat.name}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {listing.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={listing.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={() => handleImportListing(listing, index)}
                      disabled={importedUrls.has(listing.url) || importingIndex === index || isImporting}
                    >
                      {importingIndex === index ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : importedUrls.has(listing.url) ? (
                        'Geïmporteerd'
                      ) : (
                        'Importeren'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {listings.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Klik op "Sync Nu" om listings op te halen van Marktplaats
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
