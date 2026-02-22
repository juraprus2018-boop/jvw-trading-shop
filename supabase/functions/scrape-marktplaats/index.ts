import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarktplaatsListing {
  title: string;
  price: string;
  url: string;
  image: string | null;
  description: string | null;
}

// Helper to decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

// Keyword mappings for automatic categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  zaagmachines: ['zaag', 'zaagtafel', 'cirkelzaag', 'decoupeerzaag', 'verstekzaag', 'kettingzaag', 'afkortzaag', 'lintzaag', 'reciprozaag'],
  'elektrisch-gereedschap': ['boormachine', 'boor', 'slijptol', 'schuurmachine', 'haakse slijper', 'accuschroef', 'klopboor', 'freesmachine', 'polijstmachine', 'heteluchtpistool', 'elektrisch', 'accu', 'oplader', 'multitool'],
  handgereedschap: ['hamer', 'tang', 'schroevendraaier', 'moersleutel', 'sleutelset', 'steeksleutel', 'ringsleutel', 'waterpomptang', 'kniptang', 'combinatietang', 'nijptang', 'meetlint', 'waterpas', 'beitel', 'vijl', 'rasp', 'schaaf', 'handzaag'],
  machines: ['machine', 'compressor', 'generator', 'lasapparaat', 'lasmachine', 'draaibank', 'freesbank', 'pers', 'werkbank', 'statief', 'stamper', 'wacker'],
  'bouw-verbouw': ['bouw', 'verbouw', 'isolatie', 'kit', 'lijm', 'mortelmixer', 'tegelsnijder', 'tegels', 'afvoer', 'drainage', 'infiltratie', 'buizen', 'pvc', 'koppeling', 'afdichting', 'cement', 'beton', 'palletbox', 'kratten'],
  accessoires: ['bit', 'schijf', 'blad', 'zaagblad', 'schuurpapier', 'schuurschijf', 'doorslijpschijf', 'diamant', 'spijker', 'schroef', 'plug', 'set', 'koffer', 'opbergbox'],
  'tuin-buiten': ['tuin', 'grasmaaier', 'heggenschaar', 'bladblazer', 'snoeischaar', 'tuinslang', 'sproeier', 'hogedruk', 'terras', 'bestrating'],
};

function detectCategorySlug(listing: MarktplaatsListing): string {
  const text = `${listing.title} ${listing.description ?? ''}`.toLowerCase();
  let bestSlug = 'overig';
  let bestScore = 0;

  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestSlug = slug;
    }
  }

  return bestSlug;
}

// Scrape a single listing page for full details
async function scrapeListingPage(url: string): Promise<MarktplaatsListing | null> {
  try {
    console.log('Scraping listing:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.log('Failed to fetch listing:', url, response.status);
      return null;
    }

    const html = await response.text();
    console.log('Listing HTML length:', html.length);

    // Extract title
    let title = 'Onbekend';
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogTitleMatch) {
      title = decodeHtmlEntities(ogTitleMatch[1]);
    } else {
      const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (pageTitleMatch) {
        title = decodeHtmlEntities(pageTitleMatch[1].split('|')[0].split('-')[0].trim());
      }
    }

    // Extract price
    let price = '';
    const ogPriceMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i);
    if (ogPriceMatch) {
      price = `€ ${ogPriceMatch[1]}`;
    } else {
      const priceJsonMatch = html.match(/"priceCents"\s*:\s*(\d+)/);
      if (priceJsonMatch) {
        price = `€ ${(parseInt(priceJsonMatch[1]) / 100).toFixed(2)}`;
      } else {
        const priceTextMatch = html.match(/class="[^"]*[Pp]rice[^"]*"[^>]*>[\s]*€?\s*([\d.,]+)/);
        if (priceTextMatch) {
          price = `€ ${priceTextMatch[1]}`;
        }
      }
    }

    // Extract image
    let image: string | null = null;
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch?.[1]) {
      image = ogImageMatch[1];
    }
    if (!image) {
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (twitterImageMatch?.[1]) image = twitterImageMatch[1];
    }
    if (!image) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          if (jsonData.image) image = Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image;
        } catch (_e) {}
      }
    }
    if (!image) {
      const cdnImageMatch = html.match(/https:\/\/[^"'\s]+\.marktplaats\.com\/[^"'\s]+(?:jpg|jpeg|png|webp)[^"'\s]*/i);
      if (cdnImageMatch) image = cdnImageMatch[0];
    }
    if (!image) {
      const imageUrlsMatch = html.match(/"imageUrls"\s*:\s*\["([^"]+)"/);
      if (imageUrlsMatch) image = imageUrlsMatch[1];
    }

    // Extract description
    let description: string | null = null;
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    if (ogDescMatch) description = decodeHtmlEntities(ogDescMatch[1]);

    return { title, price, url, image, description };
  } catch (error) {
    console.error('Error scraping listing:', url, error);
    return null;
  }
}

function extractListingUrls(html: string): string[] {
  const listingUrls: string[] = [];
  let urlMatch;

  // Pattern 1: relative /v/ URLs
  const p1 = /href="(\/v\/[^"]+)"/gi;
  while ((urlMatch = p1.exec(html)) !== null) {
    const path = urlMatch[1].split('?')[0].split('#')[0];
    const fullUrl = `https://www.marktplaats.nl${path}`;
    if (!listingUrls.includes(fullUrl)) listingUrls.push(fullUrl);
  }

  // Pattern 2: full URLs
  const p2 = /href="(https?:\/\/(?:www\.)?marktplaats\.nl\/v\/[^"]+)"/gi;
  while ((urlMatch = p2.exec(html)) !== null) {
    const fullUrl = urlMatch[1].split('?')[0].split('#')[0];
    if (!listingUrls.includes(fullUrl)) listingUrls.push(fullUrl);
  }

  // Pattern 3: URLs in data attributes or JSON
  const p3 = /(?:url|href|link)['":\s]*["']?(https?:\/\/(?:www\.)?marktplaats\.nl\/v\/[^"'\s,}]+)/gi;
  while ((urlMatch = p3.exec(html)) !== null) {
    const fullUrl = urlMatch[1].split('?')[0].split('#')[0];
    if (!listingUrls.includes(fullUrl)) listingUrls.push(fullUrl);
  }

  // Pattern 4: /v/ paths in JSON data
  const p4 = /["'](\/v\/[a-z0-9-]+\/[a-z0-9-]+\/m\d+-[^"']+)["']/gi;
  while ((urlMatch = p4.exec(html)) !== null) {
    const path = urlMatch[1].split('?')[0].split('#')[0];
    const fullUrl = `https://www.marktplaats.nl${path}`;
    if (!listingUrls.includes(fullUrl)) listingUrls.push(fullUrl);
  }

  return listingUrls;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileUrl, autoSync } = await req.json();

    if (!profileUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profile URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping Marktplaats profile:', profileUrl);

    // Fetch the profile page
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Marktplaats page:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch page: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    console.log('Received profile HTML length:', html.length);

    const listingUrls = extractListingUrls(html);
    console.log(`Found ${listingUrls.length} listing URLs`);
    for (const u of listingUrls) console.log('  -', u);

    // Scrape each listing page
    const listings: MarktplaatsListing[] = [];
    for (const listingUrl of listingUrls) {
      const listing = await scrapeListingPage(listingUrl);
      if (listing && listing.title !== 'Onbekend') {
        listings.push(listing);
        console.log('Added listing:', listing.title, '- Image:', listing.image ? 'YES' : 'NO');
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`Scraped ${listings.length} listings with details`);

    // ── Auto-sync mode: import new, update existing, deactivate removed ──
    if (autoSync) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Load categories for auto-categorisation
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug');
      const categoryMap = new Map((categories || []).map((c: any) => [c.slug, c.id]));

      // Get all existing Marktplaats-sourced products
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, source_url, active')
        .not('source_url', 'is', null);

      const existingByUrl = new Map(
        (existingProducts || []).map((p: any) => [p.source_url, p])
      );

      const activeListingUrls = new Set(listings.map(l => l.url));

      let imported = 0;
      let updated = 0;
      let deactivated = 0;

      // Import new listings / reactivate returned ones
      for (const listing of listings) {
        const existing = existingByUrl.get(listing.url);
        const priceNum = parseFloat(listing.price.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

        if (!existing) {
          // New product – insert
          const slugBase = listing.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
          const slug = `${slugBase || 'product'}-${Date.now()}`;
          const categorySlug = detectCategorySlug(listing);
          const categoryId = categoryMap.get(categorySlug) || categoryMap.get('overig') || null;

          const { error } = await supabase.from('products').insert({
            name: listing.title,
            slug,
            description: listing.description || `Geïmporteerd van Marktplaats`,
            price: priceNum,
            condition: 'gebruikt',
            stock: 1,
            images: listing.image ? [listing.image] : [],
            active: true,
            featured: false,
            category_id: categoryId,
            source_url: listing.url,
          });

          if (!error) imported++;
          else console.error('Insert error:', error.message);
        } else if (!existing.active) {
          // Was deactivated, now back on Marktplaats – reactivate
          await supabase.from('products').update({ active: true, price: priceNum }).eq('id', existing.id);
          updated++;
        }
      }

      // Deactivate products no longer on Marktplaats
      for (const [url, product] of existingByUrl) {
        if (!activeListingUrls.has(url) && product.active) {
          await supabase.from('products').update({ active: false }).eq('id', product.id);
          deactivated++;
        }
      }

      console.log(`Auto-sync complete: ${imported} imported, ${updated} reactivated, ${deactivated} deactivated`);

      return new Response(
        JSON.stringify({ success: true, listings, count: listings.length, imported, updated, deactivated }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: just return scraped listings
    return new Response(
      JSON.stringify({ success: true, listings, count: listings.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping Marktplaats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
