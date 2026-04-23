# Limen

> **The threshold for listings** — AI-powered real estate listing platform for realtors.

**Repository:** https://github.com/taskrocketai-create/limen

Limen gives realtors a structured intake workflow, AI-generated listing copy (via Anthropic Claude), and a one-click MLS submission path. Homeowners complete a guided, mobile-first intake form via a private token link — no app download, no login required.

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

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
SPARK_API_KEY
NEXT_PUBLIC_APP_URL
```

> **Preview mode:** If `NEXT_PUBLIC_SUPABASE_URL` is empty or set to `https://placeholder.supabase.co`, the app runs in preview mode with mock data — no Supabase credentials needed for local UI development.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Set up the database

Apply migrations to your Supabase project:

```bash
supabase db push
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/login` | Realtor sign-in |
| `/signup` | Realtor registration |
| `/dashboard` | Listing portfolio, metrics, notifications |
| `/listings/new` | 3-step new listing form |
| `/listings/[id]` | AI copy output + social studio |
| `/listings/[id]/archived` | Read-only sold/archived listing view |
| `/intake/[token]` | 4-step homeowner intake (unauthenticated) |

## API Routes

| Route | Description |
|-------|-------------|
| `POST /api/listings` | Create a new listing |
| `POST /api/listings/[id]/generate` | Generate AI copy via Anthropic |
| `POST /api/listings/[id]/approve` | Approve an AI output |
| `POST /api/listings/[id]/mls-submit` | Submit to MLS via Spark API |
| `POST /api/intake/[token]` | Submit homeowner intake form |
| `POST /api/notifications/[id]/read` | Mark notification read |
| `POST /api/notifications/read-all` | Mark all notifications read |
| `POST /api/stripe/create-checkout` | Create Stripe checkout session |
| `POST /api/stripe/create-portal` | Create Stripe billing portal session |
| `POST /api/stripe/webhook` | Handle Stripe subscription events |

## MLS Submission Path

Wilson Board of Realtors → NCRMLS → Hive MLS → Flexmls → **Spark API**

Register at [sparkplatform.com](https://sparkplatform.com) before wiring MLS submission. MLS submission is always human-triggered — never auto-published.

## References

- [Project brief](./LIMEN_BRIEF.md)
- [Spark API](https://sparkplatform.com)
- [Supabase docs](https://supabase.com/docs)
- [Anthropic SDK](https://docs.anthropic.com)
- [Next.js 14 App Router](https://nextjs.org/docs)
