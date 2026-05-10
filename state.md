# Project State

> This file is maintained automatically by the agent. Updated after every change.

---

## Current Phase

- **Phase:** `MVP Built - Debugging & Testing`
- **Status:** `In Progress`
- **Last Updated:** `2026-05-10`

---

## Last Session Work

### Summary
Updated `HANDOFF.md` with current project truth: working MVP flows, fixed bugs, ngrok/webhook setup, Supabase/Composio details, asset vault implementation, verification status, known gaps, and next recommended phase.

### Files Changed
| File | Change Type | Notes |
|------|-------------|-------|
| `HANDOFF.md` | Modified | Rewritten with complete current context for future LLM handoff |
| `state.md` | Modified | Session sync after handoff refresh |

---

## Decisions Made

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 1 | Clerk over Supabase Auth | Built-in Organizations, magic links, RBAC, MFA | 2026-05-10 |
| 2 | DodoPayments over Stripe | User preference | 2026-05-10 |
| 3 | Supabase for DB + Storage only | Clerk = auth, Supabase = data | 2026-05-10 |
| 4 | Resend for business emails | Full template control | 2026-05-10 |
| 5 | Vercel deployment (AWS-portable) | Quick start, no lock-in | 2026-05-10 |
| 6 | `@uiw/react-md-editor` | Features vs. bundle size | 2026-05-10 |
| 7 | Prices as BIGINT cents | Avoid float errors | 2026-05-10 |
| 8 | Standard Webhooks for Dodo | HMAC-SHA256 + replay protection | 2026-05-10 |
| 9 | DOMPurify for markdown rendering | Prevent XSS in client portal | 2026-05-10 |
| 10 | `create-org` outside admin layout | Prevent infinite redirect when user has no org | 2026-05-10 |
| 11 | Project-create org source = Clerk auth context first | Avoid client payload drift and reduce tenancy spoof risk | 2026-05-10 |
| 12 | Auto-provision missing agency during project creation | Remove webhook timing race and unblock first project create | 2026-05-10 |
| 13 | Sync caller profile tenancy during project create | Prevent RLS read failures (`Project not found`) after fallback provisioning | 2026-05-10 |
| 14 | Admin server pages use service-role Supabase client with Clerk org filtering | Supabase anon SSR client lacks Clerk JWT claims, so RLS blocks valid admin reads | 2026-05-10 |
| 15 | Payment return confirms against Dodo API before activating project | Local webhooks cannot receive Dodo events through `localhost`; return verification unblocks dev flow | 2026-05-10 |
| 16 | Store project assets in private Supabase Storage bucket `project-assets` | Keeps uploaded files private while `assets` table stores searchable metadata | 2026-05-10 |

---

## Open Questions

| # | Question | Priority | Owner |
|---|----------|----------|-------|
| 1 | Does asset upload/download work through portal workspace after active status? | High | Agent |
| 2 | End-to-end flow test needed | High | Agent |

---

## Notes

- Caveman mode active
- Composio Supabase connection validated against Studio OS ref `vnmvtbcgrpwgncjafocv`
- Workspace + deliverables are placeholder pages
- PDF generation (Puppeteer) deferred to polish phase
- GSAP animations deferred to polish phase
- Lint passes with `npm.cmd run lint`
- Dodo webhook table had no events after local test, confirming webhook did not reach local app
- Configure Dodo webhook URL as `https://subside-stable-sagging.ngrok-free.dev/api/webhooks/dodo`
- Configure Clerk webhook URL as `https://subside-stable-sagging.ngrok-free.dev/api/webhooks/clerk`
- Lint passes with `npm.cmd run lint`
- TypeScript passes with `npx.cmd tsc --noEmit`
- Next immediate step: implement deliverables/handoff phase or PDF contract generation
