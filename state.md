# Project State

> This file is maintained automatically by the agent. Updated after every change.

---

## Current Phase

- **Phase:** `Client Dashboard + Deliverables Manager`
- **Status:** `In Progress`
- **Last Updated:** `2026-05-11`

---

## Last Session Work

### Summary
Implemented dedicated client dashboard routes and separated admin-created deliverables from client-uploaded assets. Added `project_deliverables` migration, deliverables API, admin deliverable manager, client project list/detail pages, improved client navigation, and deliverables page backed by `project_deliverables` instead of `assets`.

### Files Changed
| File | Change Type | Notes |
|------|-------------|-------|
| `supabase/migrations/002_project_deliverables.sql` | Created | Adds dedicated `project_deliverables` table |
| `app/api/deliverables/route.ts` | Created | Admin creates file/link deliverables and clients list signed downloads |
| `components/admin/deliverable-manager.tsx` | Created | Admin UI to add deliverable links/files |
| `app/admin/projects/[id]/page.tsx` | Modified | Adds deliverable manager to project detail |
| `app/portal/[projectId]/deliverables/page.tsx` | Modified | Reads `project_deliverables`, not client-uploaded `assets` |
| `app/client/layout.tsx` | Created | Client dashboard shell/sidebar/header |
| `app/client/page.tsx` | Modified | Client dashboard summary cards and recent projects |
| `app/client/projects/page.tsx` | Created | Client project list route |
| `app/client/projects/[projectId]/page.tsx` | Created | Client project detail route with actions |
| `app/portal/[projectId]/layout.tsx` | Modified | Adds back navigation to client project detail |
| `state.md` | Modified | Session sync after client dashboard/deliverables work |

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
| 17 | Completed project requires final payment before deliverables unlock | Matches handoff lifecycle: complete -> final pay -> maintenance/deliverables | 2026-05-11 |
| 18 | Add separate client dashboard entry at `/client` | Lets users enter client-facing project view without direct project URL | 2026-05-11 |
| 19 | Portal dashboard status order prioritizes project status over contract existence | Prevents active projects with contracts from showing stale signed/processing state | 2026-05-11 |
| 20 | Use `project_deliverables` for admin handoff items | Prevents client-uploaded assets from appearing as final deliverables | 2026-05-11 |

---

## Open Questions

| # | Question | Priority | Owner |
|---|----------|----------|-------|
| 1 | Has `002_project_deliverables.sql` been run on Supabase? | High | User |
| 2 | Does admin add deliverable -> client download work after migration? | High | Agent |
| 3 | Does client dashboard show correct projects for real invited client accounts? | High | Agent |

---

## Notes

- Caveman mode active
- Composio Supabase connection validated against Studio OS ref `vnmvtbcgrpwgncjafocv`
- Deliverables page now unlocks signed asset downloads after final payment
- PDF generation (Puppeteer) deferred to polish phase
- GSAP animations deferred to polish phase
- Lint passes with `npm.cmd run lint`
- Dodo webhook table had no events after local test, confirming webhook did not reach local app
- Configure Dodo webhook URL as `https://subside-stable-sagging.ngrok-free.dev/api/webhooks/dodo`
- Configure Clerk webhook URL as `https://subside-stable-sagging.ngrok-free.dev/api/webhooks/clerk`
- Lint passes with `npm.cmd run lint`
- TypeScript passes with `npx.cmd tsc --noEmit`
- Latest validation: `npm.cmd run lint` and `npx.cmd tsc --noEmit` pass
- Composio Supabase auth returned `Auth required`; migration was written locally but not applied remotely by agent
- `HANDOFF.md` intentionally not updated per user request
- Next immediate step: run `supabase/migrations/002_project_deliverables.sql`, then test admin add deliverable -> client deliverables
