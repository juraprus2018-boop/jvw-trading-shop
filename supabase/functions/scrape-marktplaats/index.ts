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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileUrl } = await req.json();
    
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
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

    // Parse listings from the HTML
    const listings: MarktplaatsListing[] = [];
    
    // Look for listing cards in the HTML
    // Marktplaats uses different patterns, we'll try to extract what we can
    
    // Pattern 1: Look for listing links with titles
    const listingPattern = /<a[^>]*href="(\/v\/[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi;
    let match;
    
    while ((match = listingPattern.exec(html)) !== null) {
      const url = `https://www.marktplaats.nl${match[1]}`;
      const title = match[2].trim();
      
      listings.push({
        title,
        price: '',
        url,
        image: null,
        description: null,
      });
    }

    // Pattern 2: Try JSON-LD structured data
    const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    while ((match = jsonLdPattern.exec(html)) !== null) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (jsonData['@type'] === 'ItemList' && jsonData.itemListElement) {
          for (const item of jsonData.itemListElement) {
            if (item.item) {
              listings.push({
                title: item.item.name || 'Onbekend',
                price: item.item.offers?.price ? `€${item.item.offers.price}` : '',
                url: item.item.url || '',
                image: item.item.image || null,
                description: item.item.description || null,
              });
            }
          }
        }
      } catch (e) {
        // JSON parse error, skip this block
      }
    }

    // Pattern 3: Look for data in script tags with listing data
    const dataPattern = /window\.__CONFIG__\s*=\s*({[\s\S]*?});/;
    const configMatch = html.match(dataPattern);
    if (configMatch) {
      try {
        const config = JSON.parse(configMatch[1]);
        console.log('Found __CONFIG__ data');
        // Extract listings from config if available
      } catch (e) {
        console.log('Could not parse __CONFIG__');
      }
    }

    // Pattern 4: Look for article elements with listing data
    const articlePattern = /<article[^>]*data-listing-id="([^"]+)"[^>]*>[\s\S]*?<\/article>/gi;
    while ((match = articlePattern.exec(html)) !== null) {
      const articleHtml = match[0];
      const listingId = match[1];
      
      // Extract title
      const titleMatch = articleHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i);
      const title = titleMatch ? titleMatch[1].trim() : `Listing ${listingId}`;
      
      // Extract price
      const priceMatch = articleHtml.match(/€\s*([\d.,]+)/);
      const price = priceMatch ? `€${priceMatch[1]}` : '';
      
      // Extract image
      const imgMatch = articleHtml.match(/src="([^"]+(?:jpg|jpeg|png|webp)[^"]*)"/i);
      const image = imgMatch ? imgMatch[1] : null;
      
      // Extract URL
      const urlMatch = articleHtml.match(/href="(\/v\/[^"]+)"/);
      const url = urlMatch ? `https://www.marktplaats.nl${urlMatch[1]}` : '';
      
      if (!listings.find(l => l.url === url)) {
        listings.push({ title, price, url, image, description: null });
      }
    }

    // Remove duplicates based on URL
    const uniqueListings = listings.filter((listing, index, self) =>
      listing.url && index === self.findIndex(l => l.url === listing.url)
    );

    console.log(`Found ${uniqueListings.length} unique listings`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        listings: uniqueListings,
        count: uniqueListings.length,
        rawHtmlLength: html.length
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
