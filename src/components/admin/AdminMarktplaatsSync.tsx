import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, ExternalLink, Package } from 'lucide-react';

interface MarktplaatsListing {
  title: string;
  price: string;
  url: string;
  image: string | null;
  description: string | null;
}

export function AdminMarktplaatsSync() {
  const [profileUrl, setProfileUrl] = useState('https://www.marktplaats.nl/u/job/26215563/');
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<MarktplaatsListing[]>([]);
  const [rawHtmlLength, setRawHtmlLength] = useState<number | null>(null);

  const handleSync = async () => {
    if (!profileUrl) {
      toast.error('Voer een Marktplaats profiel URL in');
      return;
    }

    setIsLoading(true);
    setListings([]);

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
      setRawHtmlLength(data.rawHtmlLength || null);
      
      if (data.listings?.length > 0) {
        toast.success(`${data.listings.length} listings gevonden!`);
      } else {
        toast.info('Geen listings gevonden. De pagina is mogelijk geblokkeerd of heeft een andere structuur.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Sync mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportListing = async (listing: MarktplaatsListing) => {
    toast.info(`Import van "${listing.title}" komt binnenkort...`);
    // TODO: Implement actual import to products table
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

          {rawHtmlLength !== null && (
            <p className="text-sm text-muted-foreground">
              Pagina opgehaald: {rawHtmlLength.toLocaleString()} karakters
            </p>
          )}
        </CardContent>
      </Card>

      {listings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gevonden Listings ({listings.length})</CardTitle>
            <CardDescription>
              Selecteer welke listings je wilt importeren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {listings.map((listing, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
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
                      {listing.price && (
                        <p className="text-sm text-accent font-semibold">{listing.price}</p>
                      )}
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
                    <Button size="sm" onClick={() => handleImportListing(listing)}>
                      Importeren
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {listings.length === 0 && rawHtmlLength !== null && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Geen listings gevonden. Dit kan komen doordat:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Marktplaats de request heeft geblokkeerd</li>
              <li>• De profielpagina een andere structuur heeft</li>
              <li>• Er geen actieve listings zijn op dit profiel</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
