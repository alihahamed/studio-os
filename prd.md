# Product Requirements Document

```
Product Name: Studio OS
Document Type: PRD & Workflow Specification
Target Persona: Independent Full-Stack Web Engineers
Aesthetic: Minimalist, Dark-Themed, Premium
```
## 1. Executive Summary

Studio OS is a vertically integrated, high-end client portal designed exclusively for independent software
engineers deploying custom web applications (e.g., complex corporate directories, property management
dashboards). Unlike generic freelancing CRMs, Studio OS integrates code infrastructure with business
logic, unifying proposals, automated financial state machines, and cross-origin DOM-level visual
feedback into a single, cryptographically secure environment.

## 2. Problem Statement

Independent full-stack engineers currently suffer from a **"Frankenstein Workflow"**. Delivering a custom
application involves using a fragmented mess of disconnected tools:

```
Proposals: Sent via Google Docs or PDFs.
Finance: Invoiced via generic Stripe links or manual bank transfers.
Feedback: Gathered through chaotic WhatsApp screenshots or long email threads.
Handoff: Assets shared via cluttered Google Drive folders.
```
This lack of professional, unified infrastructure leads to scope creep, delayed payments, and a "cheap"
client experience that makes it difficult to justify premium rates.

## 3. Target Users

```
Independent Full-Stack Engineers: Developers building complex, bespoke web applications using
modern stacks like Next.js, Node.js, and Supabase.
Boutique Digital Agencies: Small, high-velocity teams that prioritize "minimalist" and "premium"
aesthetics and need a white-labeled environment for their clients.
```
##### • • • • • •


```
Technical Product Founders: Engineers who manage their own freelance clients while building their
own SaaS products.
```
## 4. Goals vs. Non-Goals

```
Category Goals (What we ARE doing) Non-Goals (What we ARE NOT doing)
```
```
Workflow
```
```
Centralizing the chaotic freelance lifecycle
into one cryptographically secure
environment.
```
```
Building a general-purpose CRM for
photographers, wedding planners, or non-
technical freelancers.
```
```
Finance
```
```
Automating the financial state machine
(Deposit -> Active -> Final Pay) using Stripe
Webhooks.
```
```
Building a full-scale accounting or tax
software suite.
```
```
Feedback
```
```
Enabling cross-origin, DOM-level visual
feedback on live staging sites using iframe
injection.
```
```
Replacing specialized design tools like
Figma for the initial wireframing/prototyping
stage.
```
```
Security
```
```
Implementing rigorous multi-tenant data
isolation via Supabase Row Level Security
(RLS).
```
```
Building a real-time collaborative code editor
or IDE.
```
```
Output
```
```
Generating immutable, timestamped PDF
contracts via Puppeteer upon client
signature.
```
```
Creating a "no-code" website builder or
template engine.
```
## 5. System Architecture & Tech Stack

To support a multi-tenant environment and complex integrations, the system relies on a rigorous
architecture:

```
Next.js (App Router) Node.js Supabase (PostgreSQL & Auth) GSAP Tailwind CSS Stripe API
Puppeteer
Multi-Tenant Database: Strict Row Level Security (RLS) in Supabase ensures data isolation between
different agencies and their respective clients.
Automated PDF Generation: Node.js & Puppeteer silently convert dynamic Next.js routes into
immutable, timestamped PDF contracts upon client signature.
```
##### •

##### •

##### •


```
Visual Staging Engine: Custom JavaScript injected into client staging iframes communicates via
window.postMessage API to capture accurate DOM coordinates for contextual feedback.
```
## 6. Core Features & UI Specifications

### 6.1 The "Black Box" Client Portal

A passwordless (magic-link authenticated) secure workspace. The UI is strictly dark-themed with high-
end typography and monochromatic palettes, leveraging GSAP for subtle micro-interactions to create an
expensive, bespoke feel.

### 6.2 Dynamic Proposal & Interactive Tiers

Proposals are built using a markdown editor in the admin panel and rendered as high-end web views for
the client. Includes interactive toggles for feature add-ons (e.g., "GSAP Animations" or "Automated
Invoice Generation"). As clients toggle options, the total project cost dynamically updates in real-time
before finalizing the contract.

### 6.3 State-Driven SVG Roadmaps

A visual representation of the project lifecycle. Instead of static text, clients view a sleek SVG timeline
powered by GSAP. Phase progression is automated by backend webhook triggers (e.g., GitHub PR
merges or Stripe payment confirmations).

### 6.4 Cross-Origin Visual Staging & Contextual Comments

Live Next.js deployments are embedded in the portal via an iframe. A custom tracking script allows
clients to click any DOM element on the staging site to leave a comment. The system records the exact
X/Y coordinates and CSS selector, mapping it to the admin's view for precise, unambiguous UI revisions.

## 7. End-to-End User Flow (The 7 Phases)

#### Phase 1: The Discovery Call (Human Interaction)

```
You get on a call with a prospective client—perhaps they need a property management dashboard or
an international corporate directory. You discuss their goals, preferred aesthetics, and overall budget.
You take your notes. Studio OS is not used here; this is pure consulting.
```
##### •


#### Phase 2: The Pitch (Admin Dashboard)

You sit down at your desk and open your Studio OS Admin Dashboard.

**Admin Action:** You create a new Project. You draft a high-end proposal using the internal markdown
editor. You set the base price for the core Next.js architecture and database design.
**The Toggles:** You add optional, interactive tiers based on the call:

- Option A: Custom GSAP micro-interactions ($X).
- Option B: Automated PDF invoice generation within their app ($Y).
**The Send:** You click "Dispatch."
**System Action:** The Node.js backend generates a secure, one-time magic link and sends a
meticulously styled HTML email to the client: _"Your custom project architecture is ready for review."_


#### Phase 3: The Close (Client Portal)

The client clicks the email link and enters the passwordless "Client Room."

**Client Experience:** They are greeted by a sleek, dark-themed, minimalist interface. They read through
the proposal. They reach the pricing section, play with the toggles, and decide to include the GSAP
animations, watching the total price smoothly tick upward.
**The Signature:** They are satisfied with the scope. They draw their signature in the canvas box and
click "Approve."
**System Action:** Puppeteer silently runs in the background, snaps a locked PDF of the exact agreed-
upon scope (with the selected toggles), stamps it with the IP and timestamp, and saves it to Supabase
Storage.

#### Phase 4: The Financial Handshake (Automated)

You don't need to manually draft an invoice or chase them for the deposit.

**System Action:** The moment the contract is signed, the backend state changes to
AWAITING_DEPOSIT. It automatically pings the Stripe API, generates a 50% deposit checkout link,
and reveals it in the UI.
**Client Experience:** They pay directly through the portal via credit card or bank transfer.
**System Action:** Stripe fires a webhook to your server. The database updates the project to ACTIVE.

#### Phase 5: The Build & Asset Collection

The project is officially live. The portal transforms from a "Proposal View" to the "Active Workspace."

**Client Experience:** They see the GSAP-animated SVG roadmap. The first node, "Asset Collection," is
highlighted. They open the Asset Vault and drag-and-drop their brand logos, typography files, and
server credentials into the secure Supabase bucket.
**Admin Action:** You pull those assets and start building the actual application. Once the database
schema and foundational routing are done, you click "Complete Phase" in your admin panel.
**System Action:** The client's roadmap animates forward to "Frontend Integration."


#### Phase 6: Visual Staging & Iteration

You have a working version of the site deployed on a Vercel staging domain.

**Admin Action:** You paste the Vercel link into the Studio OS admin dashboard.
**Client Experience:** The client receives a notification. They open the portal and see their custom
application loaded inside the staging iframe. Instead of emailing you screenshots saying "make the
hero section darker," they click directly on the hero section in the iframe. A dark-themed comment box
pops up: _"Can we make the background slightly more minimalist?"_
**Admin Action:** You see the exact coordinates and CSS selector of their comment in your dashboard.
You adjust the Tailwind classes, push the code, and click "Resolve" on the comment.

#### Phase 7: The Handoff

The roadmap reaches the final node.

**Admin Action:** You trigger the "Project Completion" state.
**System Action:** The system automatically issues the final 50% invoice via Stripe.
**Client Experience:** The client pays the final balance. Instantly, the portal unlocks the "Deliverables"
section. They can now access the production deployment URLs, the GitHub repository transfer link,
and any technical documentation you provided.
**The End State:** The project moves to MAINTENANCE. The roadmap disappears, replaced by a clean
dashboard where they can submit future support tickets or request new feature retainers.


