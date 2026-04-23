# Limen — Completion Pass

This bundle fills in placeholders and broken references from the initial scaffold.
Unzip at the repo root and commit.

## New files

| Path | Purpose |
|------|---------|
| `app/settings/page.tsx` | Realtor settings page (server) |
| `components/settings/SettingsClient.tsx` | Profile editor, billing portal link, sign-out |
| `app/not-found.tsx` | Branded 404 page |
| `app/auth/callback/route.ts` | Supabase email-confirmation callback |
| `app/icon.tsx` | Favicon generated from doorway mark |
| `app/apple-icon.tsx` | iOS touch icon |
| `app/api/auth/signout/route.ts` | Sign-out endpoint |
| `app/api/profile/route.ts` | PATCH profile fields |
| `app/api/listings/[id]/send-intake/route.ts` | Send or resend intake email |
| `app/api/listings/[id]/mark-sold/route.ts` | Transition listing to sold |
| `app/api/intake/[token]/upload/route.ts` | Homeowner photo upload (direct to Storage) |
| `utils/email.ts` | Resend integration with dev console fallback |

## Replaced files

| Path | Change |
|------|--------|
| `middleware.ts` | Added `/api/stripe/webhook`, `/auth/`, `/api/auth/` to public paths; added `/settings` to protected routes |
| `app/dashboard/page.tsx` | `.maybeSingle()` + null-safe data handling |
| `app/listings/[id]/page.tsx` | `.maybeSingle()` on listing + details lookups |
| `app/listings/[id]/archived/page.tsx` | `.maybeSingle()` |
| `app/intake/[token]/page.tsx` | `.maybeSingle()` |
| `app/api/intake/[token]/route.ts` | `.maybeSingle()` + explicit `onConflict` on upsert |
| `app/api/listings/route.ts` | Sends intake email when `send_intake_now: true` |
| `app/api/listings/[id]/generate/route.ts` | `.maybeSingle()`, strips markdown fences from AI output |
| `app/api/listings/[id]/approve/route.ts` | `.maybeSingle()` |
| `components/intake/HomeownerIntakeForm.tsx` | Added Step 5 with real photo uploads |
| `components/listings/output/ListingOutputClient.tsx` | Added resend-intake and mark-as-sold controls; `router.refresh()` after mutations |
| `.env.local.example` | Added `RESEND_API_KEY` and `RESEND_FROM_EMAIL` |

## New env vars

```
RESEND_API_KEY=           # optional — falls back to console logging
RESEND_FROM_EMAIL=        # e.g. "Limen <hello@yourdomain.com>"
```

Without `RESEND_API_KEY`, intake emails are logged to the server console
instead of sent — dev works without an email provider configured.

## Open items (from the brief, not addressed here)

- Stripe plan tiers and prices — not hardcoded; `create-checkout` takes a
  `price_id` from the client
- Spark API sandbox credentials — the client matches the public docs but
  has not been tested against a live endpoint

## Follow-up you may want

- Add a pricing page (`/pricing`) that calls `/api/stripe/create-checkout`
- Wire a "Notifications settings" section to `SettingsClient`
- Add a lightweight `/legal/privacy` and `/legal/terms` for the footer
