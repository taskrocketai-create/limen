# CC-CLI Engineering Task Candidate: Limen

## Proposed assignment: Strengthen listing access control and AI-generation error handling

Investigate authorization and error-handling behavior in `app/api/listings/[id]/generate/route.ts` and related listing routes. Identify and reproduce a specific weakness or failure before implementing a fix.

### Candidate areas

1. Ensure a signed-in user cannot access or mutate another realtor's listing.
2. Handle invalid request bodies and unsupported platform values predictably.
3. Handle Anthropic API errors, malformed JSON, and missing environment configuration without leaking internal details.
4. Confirm usage-limit accounting is correct and does not silently rely on a hard-coded plan when multiple plans are offered.

### Expected deliverables

- A reproducible failing test using synthetic listing data and mocked Supabase/Anthropic calls.
- A narrowly scoped implementation fix.
- Tests covering unauthorized, missing listing, invalid input, external API failure, and success paths where relevant.
- Documented test commands and results.

### Constraints

Do not use real homeowner data, live API credentials, or production billing transactions. Preserve the human-review requirement before publishing listing content. Do not claim a vulnerability is confirmed until reproduced.

This is a proposed engineering task, not a verified defect report.
