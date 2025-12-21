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

// Scrape a single listing page for full details
async function scrapeListingPage(url: string): Promise<MarktplaatsListing | null> {
  try {
    console.log('Scraping listing:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      console.log('Failed to fetch listing:', url, response.status);
      return null;
    }

    const html = await response.text();
    console.log('Listing HTML length:', html.length);

    // Extract title from og:title or page title
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

    // Extract price from various sources
    let price = '';
    const ogPriceMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i);
    if (ogPriceMatch) {
      price = `€ ${ogPriceMatch[1]}`;
    } else {
      // Try JSON data in script tags
      const priceJsonMatch = html.match(/"priceCents"\s*:\s*(\d+)/);
      if (priceJsonMatch) {
        price = `€ ${(parseInt(priceJsonMatch[1]) / 100).toFixed(2)}`;
      } else {
        // Try finding price in page content
        const priceTextMatch = html.match(/class="[^"]*[Pp]rice[^"]*"[^>]*>[\s]*€?\s*([\d.,]+)/);
        if (priceTextMatch) {
          price = `€ ${priceTextMatch[1]}`;
        }
      }
    }

    // Extract image - try multiple sources
    let image: string | null = null;
    
    // 1. Try og:image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      image = ogImageMatch[1];
      console.log('Found og:image:', image);
    }

    // 2. Try twitter:image
    if (!image) {
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (twitterImageMatch && twitterImageMatch[1]) {
        image = twitterImageMatch[1];
        console.log('Found twitter:image:', image);
      }
    }

    // 3. Try JSON-LD structured data
    if (!image) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          if (jsonData.image) {
            image = Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image;
            console.log('Found JSON-LD image:', image);
          }
        } catch (e) {}
      }
    }

    // 4. Try finding images in the main content
    if (!image) {
      // Look for high-res images from Marktplaats CDN
      const cdnImageMatch = html.match(/https:\/\/[^"'\s]+\.marktplaats\.com\/[^"'\s]+(?:jpg|jpeg|png|webp)[^"'\s]*/i);
      if (cdnImageMatch) {
        image = cdnImageMatch[0];
        console.log('Found CDN image:', image);
      }
    }

    // 5. Try imageUrls from JavaScript data
    if (!image) {
      const imageUrlsMatch = html.match(/"imageUrls"\s*:\s*\["([^"]+)"/);
      if (imageUrlsMatch) {
        image = imageUrlsMatch[1];
        console.log('Found imageUrls:', image);
      }
    }

    // Extract description from og:description
    let description: string | null = null;
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    if (ogDescMatch) {
      description = decodeHtmlEntities(ogDescMatch[1]);
    }

    return {
      title,
      price,
      url,
      image,
      description,
    };
  } catch (error) {
    console.error('Error scraping listing:', url, error);
    return null;
  }
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

    // Fetch the profile page
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
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

    // Find all listing URLs from the profile page
    const listingUrls: string[] = [];
    const urlPattern = /href="(\/v\/[^"]+m\d+[^"]*)"/gi;
    let urlMatch;
    while ((urlMatch = urlPattern.exec(html)) !== null) {
      const fullUrl = `https://www.marktplaats.nl${urlMatch[1].split('?')[0]}`;
      if (!listingUrls.includes(fullUrl)) {
        listingUrls.push(fullUrl);
      }
    }

    console.log(`Found ${listingUrls.length} listing URLs`);

    // Scrape each listing page for full details
    const listings: MarktplaatsListing[] = [];
    
    for (const listingUrl of listingUrls) {
      const listing = await scrapeListingPage(listingUrl);
      if (listing && listing.title !== 'Onbekend') {
        listings.push(listing);
        console.log('Added listing:', listing.title, '- Image:', listing.image ? 'YES' : 'NO');
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`Scraped ${listings.length} listings with details`);

    // If importToDb is true, save to database
    if (importToDb && listings.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      let imported = 0;
      for (const listing of listings) {
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
          listings,
          count: listings.length,
          imported,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        listings,
        count: listings.length,
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
