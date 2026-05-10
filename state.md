# Project State

> This file is maintained automatically by the agent. Updated after every change.

---

## Current Phase

- **Phase:** `MVP Complete — Ready for Testing`
- **Status:** `Complete`
- **Last Updated:** `2026-05-10`

---

## Last Session Work

### Summary
Built full MVP: admin dashboard (sidebar, projects CRUD, proposal editor with markdown + addons + pricing, dispatch via Resend), client portal (proposal view with interactive toggles, signature canvas, contract signing, payment via DodoPayments), all API routes (projects, proposals, contracts, payments, webhooks), design system, and database migration. Build passes clean with 22 routes.

### Files Changed
| File | Change Type | Notes |
|------|-------------|-------|
| `app/globals.css` | Modified | Premium design system |
| `app/admin/layout.tsx` | Created | Admin shell with auth guard |
| `app/admin/page.tsx` | Created | Dashboard with stats + projects |
| `app/admin/create-org/page.tsx` | Created | Clerk org creation |
| `app/admin/projects/page.tsx` | Created | Project list table |
| `app/admin/projects/new/page.tsx` | Created | Create project form |
| `app/admin/projects/[id]/page.tsx` | Created | Project detail view |
| `app/admin/projects/[id]/proposal/page.tsx` | Created | Markdown proposal editor |
| `app/admin/settings/page.tsx` | Created | Settings placeholder |
| `app/portal/[projectId]/layout.tsx` | Created | Client portal shell |
| `app/portal/[projectId]/page.tsx` | Created | Status-aware portal page |
| `app/portal/[projectId]/payment/page.tsx` | Created | Payment page |
| `app/portal/[projectId]/workspace/page.tsx` | Created | Workspace placeholder |
| `app/portal/[projectId]/deliverables/page.tsx` | Created | Deliverables placeholder |
| `app/api/projects/route.ts` | Created | Project creation API |
| `app/api/proposals/[projectId]/route.ts` | Created | Proposal GET/PUT API |
| `app/api/proposals/dispatch/route.ts` | Created | Dispatch email API |
| `app/api/contracts/sign/route.ts` | Created | Contract signing API |
| `app/api/payments/create-session/route.ts` | Created | DodoPayments checkout API |
| `components/admin/sidebar.tsx` | Created | Admin sidebar |
| `components/admin/header.tsx` | Created | Admin header |
| `components/portal/proposal-view.tsx` | Created | Interactive proposal + signature |

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

---

## Open Questions

| # | Question | Priority | Owner |
|---|----------|----------|-------|
| 1 | Run migration SQL in Supabase SQL Editor | High | User |
| 2 | Set up Clerk webhook endpoint | Medium | User |
| 3 | Create DodoPayments product for checkout | Medium | User |

---

## Notes

- Build: 22 routes, exit code 0
- Caveman mode active
- Workspace + deliverables pages are placeholders (MVP scope)
- PDF generation (Puppeteer) deferred to polish phase
- GSAP animations deferred to polish phase