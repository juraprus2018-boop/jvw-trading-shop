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

// Helper to extract text between patterns
function extractBetween(html: string, start: string, end: string): string | null {
  const startIdx = html.indexOf(start);
  if (startIdx === -1) return null;
  const endIdx = html.indexOf(end, startIdx + start.length);
  if (endIdx === -1) return null;
  return html.substring(startIdx + start.length, endIdx);
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileUrl, importToDb } = await req.json();
    
    if (!profileUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profile URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping Marktplaats profile:', profileUrl);

    // Fetch the profile page with mobile user agent for simpler HTML
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
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
    console.log('Received HTML length:', html.length);

    const listings: MarktplaatsListing[] = [];
    
    // Strategy 1: Look for __NUXT__ or __NEXT_DATA__ JSON data
    const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*({[\s\S]*?})\s*;<\/script>/);
    const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        console.log('Found __NEXT_DATA__');
        // Navigate through Next.js data structure
        const props = nextData?.props?.pageProps;
        if (props?.listings || props?.items || props?.ads) {
          const items = props.listings || props.items || props.ads;
          for (const item of items) {
            listings.push({
              title: item.title || item.name || 'Onbekend',
              price: item.price?.amount ? `€${item.price.amount}` : (item.priceInfo?.priceCents ? `€${(item.priceInfo.priceCents / 100).toFixed(2)}` : ''),
              url: item.url || item.vipUrl || `https://www.marktplaats.nl${item.itemId ? `/v/item/${item.itemId}` : ''}`,
              image: item.imageUrls?.[0] || item.pictures?.[0]?.url || item.image || null,
              description: item.description || null,
            });
          }
        }
      } catch (e) {
        console.log('Could not parse __NEXT_DATA__:', e);
      }
    }

    // Strategy 2: Look for listing cards with data attributes
    const cardPatterns = [
      // Pattern for listing items with data attributes
      /<li[^>]*class="[^"]*hz-Listing[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
      /<article[^>]*class="[^"]*listing[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
      /<div[^>]*class="[^"]*listing-item[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    ];

    for (const pattern of cardPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const cardHtml = match[1] || match[0];
        
        // Extract URL first
        const urlMatch = cardHtml.match(/href="(\/v\/[^"]+)"/i) || 
                         cardHtml.match(/href="(https:\/\/www\.marktplaats\.nl\/v\/[^"]+)"/i);
        if (!urlMatch) continue;
        
        const url = urlMatch[1].startsWith('http') ? urlMatch[1] : `https://www.marktplaats.nl${urlMatch[1]}`;
        
        // Skip if we already have this URL
        if (listings.some(l => l.url === url)) continue;
        
        // Extract title from various possible locations
        const titleMatch = cardHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i) ||
                          cardHtml.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)</i) ||
                          cardHtml.match(/aria-label="([^"]+)"/i) ||
                          cardHtml.match(/alt="([^"]+)"/i);
        const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : 'Onbekend';
        
        // Extract price - look for euro amounts
        const priceMatch = cardHtml.match(/€\s*([\d.,]+)/) ||
                          cardHtml.match(/data-price="([^"]+)"/) ||
                          cardHtml.match(/"price"[^>]*>([\d.,]+)/);
        let price = '';
        if (priceMatch) {
          price = `€ ${priceMatch[1].replace(',', '.')}`;
        }
        
        // Extract image - look for src or data-src
        const imgMatch = cardHtml.match(/src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ||
                        cardHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ||
                        cardHtml.match(/srcset="([^\s"]+)/i);
        let image = imgMatch ? imgMatch[1] : null;
        
        // Fix relative URLs
        if (image && !image.startsWith('http')) {
          image = `https://www.marktplaats.nl${image}`;
        }
        
        listings.push({ title, price, url, image, description: null });
      }
    }

    // Strategy 3: Parse individual listing URLs and scrape each one for details
    // First, find all listing URLs
    const allUrls: string[] = [];
    const urlPattern = /href="(\/v\/[^"]+m\d+[^"]*)"/gi;
    let urlMatch;
    while ((urlMatch = urlPattern.exec(html)) !== null) {
      const fullUrl = `https://www.marktplaats.nl${urlMatch[1]}`;
      if (!allUrls.includes(fullUrl) && !listings.some(l => l.url === fullUrl)) {
        allUrls.push(fullUrl);
      }
    }

    console.log(`Found ${allUrls.length} additional URLs to scrape`);

    // Scrape each individual listing for full details (limit to 10 to avoid rate limiting)
    for (const listingUrl of allUrls.slice(0, 10)) {
      try {
        console.log('Scraping individual listing:', listingUrl);
        const listingResponse = await fetch(listingUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'text/html',
            'Accept-Language': 'nl-NL,nl;q=0.9',
          },
        });

        if (listingResponse.ok) {
          const listingHtml = await listingResponse.text();
          
          // Try to get title from og:title or page title
          const ogTitleMatch = listingHtml.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
          const pageTitleMatch = listingHtml.match(/<title>([^<]+)<\/title>/i);
          const title = ogTitleMatch ? decodeHtmlEntities(ogTitleMatch[1]) : 
                       pageTitleMatch ? decodeHtmlEntities(pageTitleMatch[1].split('|')[0].trim()) : 'Onbekend';
          
          // Get price from og:price or page content
          const ogPriceMatch = listingHtml.match(/<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i);
          const priceSpanMatch = listingHtml.match(/class="[^"]*price[^"]*"[^>]*>€?\s*([\d.,]+)/i);
          const priceJsonMatch = listingHtml.match(/"priceInfo"[^}]*"priceCents":\s*(\d+)/);
          let price = '';
          if (ogPriceMatch) {
            price = `€ ${ogPriceMatch[1]}`;
          } else if (priceSpanMatch) {
            price = `€ ${priceSpanMatch[1]}`;
          } else if (priceJsonMatch) {
            price = `€ ${(parseInt(priceJsonMatch[1]) / 100).toFixed(2)}`;
          }
          
          // Get image from og:image
          const ogImageMatch = listingHtml.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
          const image = ogImageMatch ? ogImageMatch[1] : null;
          
          // Get description from og:description
          const ogDescMatch = listingHtml.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
          const description = ogDescMatch ? decodeHtmlEntities(ogDescMatch[1]) : null;
          
          if (title !== 'Onbekend' && !listings.some(l => l.url === listingUrl)) {
            listings.push({ title, price, url: listingUrl, image, description });
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.log('Error scraping listing:', listingUrl, e);
      }
    }

    // Strategy 4: Look for JSON-LD structured data
    const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let jsonMatch;
    while ((jsonMatch = jsonLdPattern.exec(html)) !== null) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData['@type'] === 'ItemList' && jsonData.itemListElement) {
          for (const item of jsonData.itemListElement) {
            const listingItem = item.item || item;
            if (listingItem.name && !listings.some(l => l.title === listingItem.name)) {
              listings.push({
                title: decodeHtmlEntities(listingItem.name),
                price: listingItem.offers?.price ? `€ ${listingItem.offers.price}` : '',
                url: listingItem.url || '',
                image: listingItem.image || null,
                description: listingItem.description || null,
              });
            }
          }
        } else if (jsonData['@type'] === 'Product' && jsonData.name) {
          if (!listings.some(l => l.title === jsonData.name)) {
            listings.push({
              title: decodeHtmlEntities(jsonData.name),
              price: jsonData.offers?.price ? `€ ${jsonData.offers.price}` : '',
              url: jsonData.url || '',
              image: jsonData.image || null,
              description: jsonData.description || null,
            });
          }
        }
      } catch (e) {
        // JSON parse error, skip
      }
    }

    // Remove duplicates and empty entries
    const uniqueListings = listings.filter((listing, index, self) =>
      listing.url && 
      listing.title !== 'Onbekend' &&
      index === self.findIndex(l => l.url === listing.url)
    );

    console.log(`Found ${uniqueListings.length} unique listings with details`);

    // If importToDb is true, save to database
    if (importToDb && uniqueListings.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      let imported = 0;
      for (const listing of uniqueListings) {
        // Create a slug from the title
        const slug = listing.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 50) + '-' + Date.now();

        // Parse price to number
        const priceNum = parseFloat(listing.price.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

        const { error } = await supabase.from('products').insert({
          name: listing.title,
          slug,
          description: listing.description || `Geïmporteerd van Marktplaats: ${listing.url}`,
          price: priceNum,
          condition: 'Gebruikt',
          stock: 1,
          images: listing.image ? [listing.image] : [],
          active: true,
          featured: false,
        });

        if (!error) {
          imported++;
        } else {
          console.error('Error importing listing:', listing.title, error);
        }
      }

      console.log(`Imported ${imported} products to database`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          listings: uniqueListings,
          count: uniqueListings.length,
          imported,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        listings: uniqueListings,
        count: uniqueListings.length,
      }),
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
