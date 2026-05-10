# Studio OS - LLM Handoff Document

> Purpose: read this first before coding. It captures current project truth, recent fixes, known constraints, and next work. Also read `state.md`, `prd.md`, `implementation_plan.md`, and `AGENTS.md`.

---

## 1. Project Overview

Studio OS is a premium dark client portal for independent full-stack engineers. It replaces scattered emails, PDFs, payment links, and ad hoc file sharing with one workflow:

Admin creates project -> drafts proposal with add-ons -> dispatches email -> client reviews portal proposal -> signs contract -> pays DodoPayments deposit -> project becomes active -> client uploads assets -> admin receives files -> future deliverables/handoff.

Primary persona: independent full-stack engineer or boutique agency.  
Current phase: MVP built, active workspace/asset vault added, next phase is deliverables/PDF/polish.

---

## 2. Current Working MVP

These flows are working as of 2026-05-10:

- Clerk sign-in/sign-up and organization flow.
- Supabase schema exists in Studio OS project.
- Admin dashboard, project list, project detail, project create.
- Project create auto-provisions missing agency when Clerk webhook sync is late.
- Admin detail/list/dashboard use `createAdminClient()` with explicit Clerk `orgId` filtering, fixing RLS read failures from anon SSR client.
- Proposal editor loads/saves markdown, base price, and add-ons.
- Proposal dispatch sends Resend email and sets project status to `proposal_sent`.
- Client portal proposal view renders.
- Client signature creates contract snapshot and moves project to `awaiting_deposit`.
- Dodo payment session creation works.
- Dodo webhook through ngrok updates payment to `succeeded` and project to `active`.
- Payment return handler can confirm payment status against Dodo if webhook is delayed.
- Active project workspace has asset upload/list/download.
- Admin project detail shows uploaded assets as signed download links.
- `npm.cmd run lint` passes.
- `npx.cmd tsc --noEmit` passes.

Manual test recently confirmed:

- Project create works.
- Admin detail no longer shows false "Project not found".
- Dispatch works.
- Payment succeeds.
- Dashboard active count updates.
- Asset upload works after raising Next proxy body limit.

---

## 3. Tech Stack

| Layer | Technology | Current Notes |
|---|---|---|
| Framework | Next.js 16 App Router | `params` is a Promise. Await route/page params. Middleware convention warns as deprecated; current project still uses `middleware.ts`. |
| Styling | Tailwind CSS v4 | Tokens in `app/globals.css` via `@theme inline`. No `tailwind.config.js`. |
| Auth | Clerk | Source of truth for users/orgs. Supabase is not auth. |
| Database | Supabase Postgres | Data layer. RLS exists, but many server-side admin reads use service role plus explicit Clerk org filtering. |
| Storage | Supabase Storage | Private bucket `project-assets`, signed URLs for downloads. |
| Payments | DodoPayments | Payment API + Standard Webhooks. Local testing uses ngrok. |
| Email | Resend | Proposal dispatch emails. |
| Markdown | `@uiw/react-md-editor` | Dynamic import in proposal editor. |
| Sanitization | `marked` + DOMPurify | Used in client proposal rendering. |
| Validation | Zod | API route body validation. |

---

## 4. Current Local Environment

Important env values conceptually present in `.env`:

```env
NEXT_PUBLIC_APP_URL=https://subside-stable-sagging.ngrok-free.dev

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...

NEXT_PUBLIC_SUPABASE_URL=https://vnmvtbcgrpwgncjafocv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

DODO_PAYMENTS_API_KEY=...
DODO_WEBHOOK_SECRET=...
DODO_ENVIRONMENT=test_mode
DODO_PRODUCT_ID=...

RESEND_API_KEY=...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

Do not paste secrets into responses. `.env` currently contains real local/test secrets.

Local webhook URLs configured/needed:

```txt
Clerk: https://subside-stable-sagging.ngrok-free.dev/api/webhooks/clerk
Dodo:  https://subside-stable-sagging.ngrok-free.dev/api/webhooks/dodo
```

Important typo fixed in guidance: route is `/api/webhooks/clerk`, not `/api/webhook/clerk`.

For local portal testing, prefer `localhost` when already signed in as admin:

```txt
http://localhost:3000/portal/<project-id>
http://localhost:3000/portal/<project-id>/workspace
```

Ngrok host has separate Clerk cookie/session behavior and may redirect to sign-in.

---

## 5. Supabase Project Truth

Correct Studio OS Supabase project:

```txt
Project ref: vnmvtbcgrpwgncjafocv
URL: https://vnmvtbcgrpwgncjafocv.supabase.co
Name: Studio OS
Status seen via Composio: ACTIVE_HEALTHY
```

Composio Supabase connection is active. Direct Supabase MCP previously pointed to the wrong project; use Composio tools with `project_ref/ref = vnmvtbcgrpwgncjafocv` when checking DB.

Tables verified in `public`:

- `profiles`
- `agencies`
- `projects`
- `proposals`
- `proposal_addons`
- `contracts`
- `payments`
- `dodo_events`
- `assets`

Storage:

- Bucket name: `project-assets`
- Created automatically on first asset upload by `app/api/assets/route.ts`
- Private bucket
- Signed URLs used for downloads
- Route/API enforces 50MB file limit

---

## 6. Project Structure: Current Important Files

```txt
app/
  admin/
    layout.tsx
    page.tsx
    projects/
      page.tsx
      new/page.tsx
      [id]/
        page.tsx
        proposal/page.tsx
    settings/page.tsx
  api/
    assets/route.ts
    contracts/sign/route.ts
    payments/
      create-session/route.ts
      confirm/route.ts
    projects/route.ts
    proposals/
      [projectId]/route.ts
      dispatch/route.ts
    webhooks/
      clerk/route.ts
      dodo/route.ts
  create-org/page.tsx
  portal/[projectId]/
    layout.tsx
    page.tsx
    payment/page.tsx
    workspace/page.tsx
    deliverables/page.tsx

components/
  admin/
    header.tsx
    sidebar.tsx
  portal/
    asset-vault.tsx
    payment-return-handler.tsx
    proposal-view.tsx

lib/
  dodo.ts
  supabase/
    admin.ts
    client.ts
    server.ts
  utils.ts
  validators/

supabase/migrations/001_initial_schema.sql
next.config.ts
state.md
HANDOFF.md
```

Recent additions:

- `app/api/assets/route.ts`
- `components/portal/asset-vault.tsx`
- `app/api/payments/confirm/route.ts`
- `components/portal/payment-return-handler.tsx`

---

## 7. Important Implementation Decisions

1. Clerk remains auth source of truth.
2. Supabase is DB + Storage only.
3. DodoPayments is used instead of Stripe.
4. Money is stored as integer cents/BIGINT only.
5. Server admin reads that need agency-scoped data use `createAdminClient()` and explicit Clerk `orgId` filters.
6. Project creation uses Clerk `auth().orgId` first, not trusted client `clerk_org_id`.
7. Project creation auto-provisions missing agency from Clerk organization metadata if webhook sync is late.
8. Project creation also syncs caller `profiles.agency_id`/`clerk_org_id`.
9. Clerk webhook handlers are idempotent via upserts.
10. Dodo webhook handler accepts event type from either `event_type` or `type`.
11. Payment return confirmation verifies Dodo payment via API before activating project, useful when local webhook is delayed.
12. Active workspace assets live in private Supabase Storage bucket `project-assets`.
13. Asset downloads are signed URLs, 10-minute expiry.
14. Next proxy client body limit is raised to 50MB in `next.config.ts`.

---

## 8. Key Flow Details

### Project Create

File: `app/api/projects/route.ts`

Behavior:

- Requires Clerk `userId`.
- Uses `auth().orgId` as source for agency.
- Falls back to optional body `clerk_org_id` only for compatibility.
- Looks up agency by `clerk_org_id`.
- If missing, fetches Clerk org and upserts `agencies`.
- Updates current profile tenancy fields.
- Inserts project.
- Inserts empty proposal.
- If proposal insert fails, deletes project as rollback.

### Admin Reads

Files:

- `app/admin/page.tsx`
- `app/admin/projects/page.tsx`
- `app/admin/projects/[id]/page.tsx`

Important: these use `createAdminClient()` because Supabase SSR anon client lacked Clerk JWT claims and RLS returned no rows. Keep explicit `orgId -> agency -> project` filtering.

### Proposal Dispatch

File: `app/api/proposals/dispatch/route.ts`

Current behavior:

- Sends Resend email.
- Uses `NEXT_PUBLIC_APP_URL` to build portal link.
- Updates project status to `proposal_sent`.

Current limitation:

- Does not fully create/manage Clerk client invitation flow yet.
- For real client auth hardening, add Clerk org invitation and set `projects.client_profile_id`.

### Contract Signing

File: `app/api/contracts/sign/route.ts`

Expected behavior:

- Client signs via canvas in `components/portal/proposal-view.tsx`.
- API snapshots proposal/add-ons/total/signature/IP.
- Creates `contracts` row.
- Moves project to `awaiting_deposit`.

PDF generation is still not implemented; `pdf_storage_path` remains future work.

### Payment

Files:

- `app/portal/[projectId]/payment/page.tsx`
- `app/api/payments/create-session/route.ts`
- `app/api/payments/confirm/route.ts`
- `components/portal/payment-return-handler.tsx`
- `app/api/webhooks/dodo/route.ts`

Behavior:

- Payment page creates Dodo payment link.
- `create-session` records `payments` row as `pending`.
- `return_url` points to `/portal/<projectId>?payment=deposit&status=success`.
- `redirect_immediately: true` is set for Dodo hosted payment.
- Return handler calls `/api/payments/confirm`.
- Confirm route retrieves Dodo payment by `dodo_payment_id`.
- If succeeded, marks payment `succeeded` and project `active`.
- Dodo webhook also updates payment/project and records `dodo_events`.

### Asset Vault

Files:

- `app/api/assets/route.ts`
- `components/portal/asset-vault.tsx`
- `app/portal/[projectId]/workspace/page.tsx`
- `app/admin/projects/[id]/page.tsx`

Behavior:

- Uploads only allowed for project statuses `active`, `completed`, `maintenance`.
- Supports images, SVG, PDF, ZIP, text, fonts.
- Max 50MB each.
- Stores file in private Supabase Storage under:

```txt
<agency_id>/<project_id>/<timestamp>-<safe-file-name>
```

- Inserts metadata into `assets`.
- Workspace lists files with signed download links.
- Admin project detail lists files with signed download links.

Recent bug fixed:

- Uploads over 10MB failed because Next proxy default cap is 10MB.
- Fixed via `next.config.ts`:

```ts
experimental: {
  proxyClientMaxBodySize: "50mb",
}
```

Need dev server restart after this config change.

---

## 9. Verification Status

Last verified commands:

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
```

Both passed after asset vault/body-limit fixes.

Build note:

- `npm.cmd run build` previously hit a Turbopack workspace-root issue because Next inferred root as `C:\Users\aliah` due to parent `pnpm-lock.yaml`, then failed with access denied.
- If build is needed, inspect `next.config.ts` docs for Next 16 and set Turbopack root explicitly to this repo before rerunning.
- User interrupted the build-root investigation before completion.

---

## 10. Current Known Gaps

High priority:

- Deliverables page is still placeholder.
- PDF generation for signed contracts is not implemented.
- Real client invitation/auth hardening is incomplete; dispatch sends email but does not fully invite/link client into Clerk org.
- Full production deployment not done.

Medium priority:

- Mobile/responsive polish pass needed.
- Settings page is placeholder.
- Admin/client role restrictions need stricter enforcement for production.
- Asset delete/replace is not implemented.
- Final payment/handoff flow is incomplete.

Future/Phase 2+:

- GSAP/SVG roadmap.
- White-label agency branding.
- iframe staging engine and contextual comments.
- GitHub integration / PR-based roadmap advancement.
- Maintenance/support ticket mode.

---

## 11. Next Recommended Phase

Build **Deliverables + Handoff** next.

Suggested scope:

1. Create deliverables metadata table or use `assets` with a deliverable flag/type. If avoiding migration for now, create minimal API + UI backed by `assets` only if acceptable.
2. Admin UI to add deliverable links/files for active/completed project.
3. Client `/portal/[projectId]/deliverables` page that unlocks at `completed` or `maintenance`.
4. Add admin action to mark project `completed`.
5. Final payment session for remaining 50%.
6. On final payment success, project moves `maintenance`.
7. Update dashboard counts/revenue and state docs.

Alternative next phase:

- Implement PDF generation for signed contracts first. Use Puppeteer locally; for Vercel use `@sparticuz/chromium`.

Recommended order:

1. Deliverables page and completion action.
2. Final payment.
3. PDF contract generation.
4. Client auth/invitation hardening.
5. Mobile/polish.

---

## 12. Rules For Future Agents

- Read `AGENTS.md`; Next.js 16 docs in `node_modules/next/dist/docs/` matter.
- Caveman mode is active in conversation style, but project docs should remain clear and complete.
- Update `state.md` after every meaningful file change or decision.
- Use `npm.cmd`, `npx.cmd` on Windows to avoid PowerShell execution-policy issues.
- Keep prices in cents.
- Do not use Supabase Auth for app auth.
- Do not expose service-role key to client components.
- Admin server reads may use service role only with explicit Clerk org filtering.
- Webhook routes must stay outside Clerk auth protection.
- For Composio Supabase queries, always target project ref `vnmvtbcgrpwgncjafocv`.
- Be careful with dirty worktree; existing unrelated changes may be user/previous-agent work.

