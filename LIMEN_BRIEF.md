# Limen — Project Brief

## Overview

Limen is an AI-powered real estate listing platform for realtors — from homeowner intake through MLS submission.

**Tagline:** The threshold for listings
**Name origin:** Latin for "threshold"

## Problem

Realtors spend hours collecting property details from homeowners, writing listing copy, and preparing MLS submissions. The process is fragmented: phone calls, email chains, manual data entry, and generic copy that fails to differentiate properties. Homeowners are passive and frustrated. Listings suffer.

## Solution

Limen gives realtors a structured intake workflow, AI-generated listing copy (via Anthropic Claude), and a one-click MLS submission path. Homeowners complete a guided, mobile-first intake form via a private token link — no app download, no login required. The realtor reviews, edits, and approves before anything is published.

## Goals

- [ ] Realtor dashboard: manage listings, track homeowner intake status, view metrics
- [ ] Homeowner intake: frictionless 4-step form delivered via UUID token link
- [ ] AI copy generation: Anthropic API produces listing description, social captions, and headline variants
- [ ] MLS submission: human-reviewed, Spark API (Flexmls) integration via Wilson Board of Realtors → NCRMLS → Hive MLS
- [ ] Subscription billing: Stripe-gated access tiers for realtors
- [ ] Photo management: Supabase Storage only (never stored in DB)

## Non-Goals

- No auto-publish to MLS — human realtor review is always required
- No watermarks anywhere in the product
- No hardcoded AI copy — all via Anthropic API
- No realtor chrome on homeowner intake screens
- No generic blue/purple/gray color schemes

## Brand — LOCKED. DO NOT CHANGE.

**Logo:** Doorway mark — two vertical posts + one horizontal lintel at the top. Posts are OPEN at the bottom. No descending stroke. Never a cross shape.

**Colors:**
| Token | Hex |
|-------|-----|
| Ink | #1A1814 |
| Gilt | #C8A96E |
| Parchment | #F7F5F1 |
| Stone | #6B6456 |
| Midnight | #111110 |

**Fonts:**
- Cormorant Garamond — ALL headlines, no fallback sans
- DM Sans — all UI / body copy

**Logo color rules:**
- Primary: Gilt (#C8A96E) mark on Ink (#1A1814) background
- Inverted: Ink (#1A1814) mark on Gilt (#C8A96E) background
- Must work at 16px favicon through 512px app icon

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS with brand tokens |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (photos only) |
| AI | Anthropic SDK — claude-sonnet |
| Payments | Stripe (subscriptions) |
| MLS | Flexmls Spark API |
| Hosting | Vercel |

## Tailwind Brand Tokens

```js
colors: {
  ink: '#1A1814',
  gilt: '#C8A96E',
  parchment: '#F7F5F1',
  stone: '#6B6456',
  midnight: '#111110'
},
fontFamily: {
  display: ['Cormorant Garamond', 'serif'],
  sans: ['DM Sans', 'sans-serif']
}
```

## Database Schema

### users (via Supabase Auth)
- id (uuid, PK)
- email
- created_at

### profiles
- id (uuid, FK → auth.users)
- full_name
- license_number
- brokerage
- phone
- stripe_customer_id
- stripe_subscription_status
- created_at, updated_at

### listings
- id (uuid, PK)
- realtor_id (uuid, FK → profiles)
- address_line1, address_line2, city, state, zip
- price
- bedrooms, bathrooms, sqft, lot_size, year_built
- property_type (enum: single_family, condo, townhouse, land, multi_family)
- status (enum: draft, intake_pending, intake_received, ai_ready, reviewed, submitted, sold, archived)
- intake_token (uuid, unique) — UUID-based, used for /intake/[token]
- intake_sent_at, intake_completed_at
- mls_number
- created_at, updated_at

### listing_details (homeowner intake responses)
- id (uuid, PK)
- listing_id (uuid, FK → listings)
- highlights (text[])
- recent_updates (text)
- neighborhood_notes (text)
- hoa_details (text)
- seller_notes (text)
- submitted_at

### listing_assets
- id (uuid, PK)
- listing_id (uuid, FK → listings)
- storage_path (text) — Supabase Storage path, never raw binary
- asset_type (enum: photo, floor_plan, document)
- sort_order (int)
- uploaded_by (enum: realtor, homeowner)
- created_at

### ai_outputs
- id (uuid, PK)
- listing_id (uuid, FK → listings)
- version (int)
- listing_description (text)
- headline_variants (text[])
- social_captions (jsonb) — {instagram, facebook, twitter}
- generated_at
- approved (bool, default false)
- approved_at

### notifications
- id (uuid, PK)
- realtor_id (uuid, FK → profiles)
- listing_id (uuid, FK → listings, nullable)
- type (enum: intake_submitted, ai_ready, mls_submitted)
- message (text)
- read (bool, default false)
- created_at

## Architecture

```
Browser
  └── Next.js 14 App Router (Vercel)
        ├── /dashboard          — Realtor portal (auth-gated)
        ├── /listings/new       — 3-step realtor intake
        ├── /listings/[id]      — AI output + social studio
        ├── /listings/[id]/archived — Sold listing view
        └── /intake/[token]     — 4-step homeowner intake (unauthenticated, no realtor chrome)

Next.js API Routes
  ├── /api/ai/generate          — Anthropic SDK → listing copy
  ├── /api/intake/[token]       — Token validation + submission
  ├── /api/mls/submit           — Spark API (human-triggered only)
  └── /api/stripe/webhook       — Subscription events

Supabase
  ├── Auth (realtor accounts)
  ├── PostgreSQL (all structured data)
  └── Storage (photos, floor plans, documents)
```

## MLS Submission Path

Wilson Board of Realtors → NCRMLS → Hive MLS → Flexmls → **Spark API**

Register at sparkplatform.com before wiring MLS submission.
MLS submission is always human-triggered by the realtor after review.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
ATTOM_API_KEY
WALKSCORE_API_KEY
GREATSCHOOLS_API_KEY
SPARK_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
```

## Build Order

1. Scaffold Next.js 14 with App Router and TypeScript
2. Install and configure Tailwind with exact brand tokens
3. Add Cormorant Garamond + DM Sans via Google Fonts
4. Set up Supabase client with environment variables
5. Create database schema
6. Build Logo mark as reusable SVG React component (`/components/brand/Logo.tsx`)
7. Build `/dashboard` — listing cards, intake status badges, metrics row, filter tabs, live search, notification bar, new listing button. Fully responsive.
8. Build `/listings/new` — 3-step realtor intake flow
9. Build `/intake/[token]` — 4-step homeowner intake, standalone, unauthenticated
10. Build `/listings/[id]` — AI listing output + social studio
11. Build `/listings/[id]/archived` — sold listing view
12. Wire Anthropic API for listing copy generation
13. Wire Stripe for subscription billing
14. Wire Flexmls Spark API for MLS submission
15. Deploy to Vercel

## Rules — Never Violate

- No watermarks anywhere in the product
- Homeowner intake has zero realtor dashboard chrome
- All AI copy via Anthropic API only — never hardcoded
- MLS submission requires human realtor review — never auto-publish
- Photos stored in Supabase Storage only — never in the database
- Intake token must be UUID-based
- Cormorant Garamond on ALL headlines — no fallback sans
- Never use generic blue, purple, or gray color schemes
- Every screen must use the Ink/Gilt/Parchment palette

## Milestones

| Milestone | Description | Target Date |
|-----------|-------------|-------------|
| M0 | Scaffold + config + schema | |
| M1 | Dashboard + intake flows (steps 6–9) | |
| M2 | AI output + social studio (steps 10–12) | |
| M3 | Billing + MLS + deploy (steps 13–15) | |

## Open Questions

- [ ] Stripe plan tiers: how many tiers, what are the limits per tier?
- [ ] Do realtors upload photos or does the homeowner upload via intake?
- [ ] Should AI output support regeneration / edit history?
- [ ] Spark API sandbox available for dev/test?

## References

- Spark API: https://sparkplatform.com
- Supabase docs: https://supabase.com/docs
- Anthropic SDK: https://docs.anthropic.com
- Next.js 14 App Router: https://nextjs.org/docs
