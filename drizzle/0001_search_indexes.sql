-- Fuzzy search ("milo" finds "MILO 400g tin", small typos still match)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_title_trgm_idx" ON "listings" USING gin ("title" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "catalog_items_name_trgm_idx" ON "catalog_items" USING gin ("name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shops_name_trgm_idx" ON "shops" USING gin ("name" gin_trgm_ops);
