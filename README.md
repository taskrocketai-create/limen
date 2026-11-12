# Limen

Limen is a development-stage AI-assisted real estate listing and marketing application for real estate professionals. Its source includes realtor dashboards, homeowner intake links, AI-assisted listing content, review workflows, and subscription-related routes.

## Stack

Next.js 14 App Router, React, TypeScript, Tailwind CSS, Supabase, Anthropic API, and Stripe. Other external integrations are represented in the code and environment example.

## Repository map

- `app/`: application pages and API routes
- `components/`: interface components
- `utils/`: integration helpers
- `supabase/migrations/`: database schema
- `LIMEN_BRIEF.md`: product goals and architecture (not a completed-feature checklist)
- `CC-CLI-TASK.md`: proposed engineering task and test expectations

## Local development

Install Node.js and npm, then:

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Populate `.env.local` with your own development credentials. Never commit keys or real homeowner information. The application relies on separately configured Supabase, Anthropic, Stripe, and potentially other accounts.

For build validation run `npm run build`. No successful build or test run is claimed in this document.

## Engineering notes

- Verify ownership authorization for listing routes and homeowner intake tokens.
- Review generated marketing content for factual accuracy and fair-housing compliance before publication.
- A route's presence does not establish that MLS integration is enabled or production-ready.
- Use synthetic data and mocked external services for tests.
- Some features and integrations are in development; consult code rather than assuming every item in the brief is implemented.

## License

A license has not yet been selected by the owner. Public source visibility does not itself grant reuse rights.
