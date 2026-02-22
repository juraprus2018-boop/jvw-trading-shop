-- Add source_url to track Marktplaats origin for auto-sync
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS source_url text;

-- Add index for quick lookup during sync
CREATE INDEX IF NOT EXISTS idx_products_source_url ON public.products (source_url) WHERE source_url IS NOT NULL;
