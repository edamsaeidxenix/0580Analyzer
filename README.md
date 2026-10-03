# Milandhoo Market

A marketplace web app for Milandhoo's shops, restaurants, guest houses and home businesses. It replaces the endless reposting in the "Milandhoo Isthihaaru" Viber group: sellers post an item once and it stays visible and searchable; customers search, compare prices and order.

See [PLAN.md](PLAN.md) for the product plan and roadmap.

## What's in this version (Phase 1 MVP)

**Customers**
- Sign in with a phone number and a 6-digit SMS code (no passwords). Browsing works without an account.
- Home page with categories (English and Dhivehi names), today's specials, new items and shops.
- Search with typo-tolerant matching, category filters, price range, in-stock filter and sorting.
- **Price comparison:** items linked to the shared product catalogue (e.g. "Milo 400g") show every shop's price, cheapest first. A listing page tells you when it's cheaper somewhere else.
- Cart saved on the phone, with one order per shop. Choose pickup or delivery, pay cash or by bank transfer (upload the receipt screenshot).
- Guest houses get booking requests with dates instead of pickup/delivery.
- Order tracking with status updates and messages from the shop. Customers can cancel until the shop confirms.
- Call or Viber the shop in one tap, share any item or shop to Viber, report bad listings.

**Sellers**
- Open a shop (admin approves it before it goes public).
- Add items in seconds: photo or existing poster, title, price. The app suggests a catalogue match so the item appears in price comparisons.
- Photos are shrunk on the phone before upload and again on the server (fast on mobile data).
- One-tap "sold out / back in stock", "🔥 special today" (24 hours on the home page), "price still correct" and hide/show.
- Order inbox: accept/reject, ready for pickup / out for delivery / completed, a message to the customer, and "payment received" for transfers.
- SMS alert to the seller on each new order; SMS to the customer on each status change.
- Dashboard with new orders, out-of-stock count, weekly sales, and a reminder about listings not updated in 7 days.

**Admin** (phones listed in `ADMIN_PHONES`)
- Approve or suspend shops, review reports (hide listing / dismiss), add products to the price-comparison catalogue, basic stats.

The site installs to the phone's home screen like an app (PWA manifest and icons).

## Tech stack

- **Next.js 16** (App Router, server actions) + React 19 + Tailwind CSS 4
- **PostgreSQL** with **Drizzle ORM**; `pg_trgm` for fuzzy search
- **sharp** for image resizing; local disk or any S3-compatible bucket for storage
- SMS through Twilio (pluggable; swap in a local Dhiraagu/Ooredoo gateway in `src/lib/sms.ts`)
- Vitest for unit tests

Prices are stored as integer **laari** (1 MVR = 100 laari) to avoid rounding errors.

## Running locally

Requires Node 20+ and PostgreSQL 14+.

```bash
npm install
cp .env.example .env          # edit DATABASE_URL and AUTH_SECRET
npm run db:migrate
npm run db:seed -- --demo     # categories, catalogue and 5 demo shops
npm run dev                   # http://localhost:3000
```

With `SMS_PROVIDER=console` (the default) no SMS is sent in development: the login code is shown on the page and printed in the server log.

Demo logins after `--demo` seeding:
- Sellers: `7000001` (Hamza Store), `7000002` (Island Mart), `7000003` (Sea Breeze Café), `7000004` (Amina's Kitchen), `7000005` (Coral View Guest House)
- Admin: whichever number is in `ADMIN_PHONES` (default `7000000`)
- Any other 7-digit number starting with 7 or 9 signs up as a new customer.

Checks:

```bash
npm test            # unit tests
npm run typecheck
npm run lint
npm run build
```

## Deploying

**Option A: one small server (simplest, about USD 5–10/month).** On any VPS with Docker:

```bash
cp .env.example .env    # set AUTH_SECRET, ADMIN_PHONES, NEXT_PUBLIC_SITE_URL, SMS_PROVIDER=twilio + keys
docker compose up -d --build
```

This runs the app, PostgreSQL and a volume for uploaded images. Migrations and the base seed run on every start (both are safe to repeat). Put Caddy or nginx in front for HTTPS.

**Option B: managed services.** Vercel (app) + Neon or Supabase (PostgreSQL) + Cloudflare R2 or Supabase Storage (`STORAGE_DRIVER=s3`). Run `npm run db:migrate && npm run db:seed` against the production database once.

Before going live:
- Set a long random `AUTH_SECRET` (`openssl rand -hex 32`).
- Configure a real SMS provider. The console provider refuses to run in production.
- Bank-transfer receipts are stored under unguessable random URLs but are not access-controlled. Use a private bucket with signed URLs if that matters to you.

## Project layout

```
src/app/            pages and server actions (one folder per route)
  sell/             seller dashboard, listings, orders, shop settings
  admin/            admin tools
src/components/     shared UI (cart, listing cards, image picker, share button…)
src/db/schema.ts    database schema
src/lib/            auth, queries, money/phone helpers, order rules, SMS, storage
drizzle/            SQL migrations
scripts/            migrate and seed scripts
```
