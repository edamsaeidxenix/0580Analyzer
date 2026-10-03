# Milandhoo Market: Product Plan

## The problem

Milandhoo's shops, guest houses, restaurants and home businesses sell through the "Milandhoo Isthihaaru" Viber group. A chat is a **feed**, so posters scroll away and sellers repost them every day. That adds up to hundreds or thousands of posts daily, and customers can't search or compare.

## The idea

Turn the feed into a **catalogue**:
- **Sellers:** post once and stay visible.
- **Customers:** find it in seconds, compare, order.
- **Community:** work alongside Viber. Sellers share one link to their shop or today's deals instead of reposting 20 posters.

## Decisions taken for the first version

These defaults were chosen so the build could start. Any of them can be changed.

| Question | Default chosen |
|---|---|
| Language | English interface; categories also shown in Dhivehi. Full Dhivehi UI in Phase 2. |
| Delivery | Each seller chooses pickup and/or their own delivery with a flat fee. |
| Payments | Cash on delivery / at pickup, plus bank transfer with receipt upload. No card gateway yet. |
| Guest houses | Booking *requests* (dates in a note) confirmed by the guest house; no availability calendar. |
| Scope | Milandhoo only, but every shop has an `island` field so nearby islands can be added later. |
| Login | Phone number + SMS code. |
| Business model | Free for sellers during launch. |

## Roadmap

### Phase 1: MVP (built)
Customer search, price comparison, cart, orders, order tracking; seller shop, fast listings, specials, order inbox, SMS alerts; admin approvals, reports and catalogue. See README for the full list.

### Phase 2: Engagement
- Follow a shop and get notified of new deals (web push).
- Ratings and reviews after completed orders.
- Full Dhivehi (Thaana, right-to-left) interface toggle.
- Restaurant pre-order time slots ("pickup at 7pm").
- Better seller stats: views, top items.
- Daily "today's deals" digest link for posting in the Viber group.

### Phase 3: Growth and revenue
- Featured placements / optional seller subscription.
- Online card payments through a local bank gateway.
- Delivery-runner role.
- Nearby islands in Shaviyani Atoll.
- AI poster reader: upload a poster and the title, price and category are filled in automatically.

## Launch plan

1. Onboard 15–25 active sellers from the Viber group in person and set up their first listings with them.
2. Launch with a full catalogue so customers never open an empty app.
3. Announce in the Viber group, then post one daily "today's deals" link there.
4. Keep it free for sellers for at least 3–6 months; collect feedback weekly.

## Risks

| Risk | Mitigation |
|---|---|
| Sellers find it more work than Viber | 30-second listing from a photo or poster; in-person setup help |
| Out-of-date prices or stock | "Updated" date on every price; one-tap "price still correct"; reminder after 7 days |
| Fake orders / no-shows | Phone-verified accounts; sellers confirm before preparing; limit on pending orders |
| Bank transfer disputes | Receipt upload + seller "payment received" confirmation |
| Slow mobile internet | Photos compressed on the phone and server; lightweight pages |
