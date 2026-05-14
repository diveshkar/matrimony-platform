# Admin Dashboard — Phased Build Plan

Internal roadmap for the in-app admin dashboard. Built incrementally so each phase ships a usable product without forcing later phases to be done all at once.

> **Authentication**: Single sign-in flow for both regular users and admins. Admin status is determined by a `role` field on the account record — there is no separate admin login portal. Users authenticate the same way (OTP via email or WhatsApp), and the frontend reveals admin UI only when `role === 'admin'`.

---

## Design Standards (apply to every phase)

These are non-negotiable across all admin work — the admin must feel like a natural extension of the user-facing app, not a Bootstrap-style admin panel.

### Visual language
- **Colour palette**: same warm cream (`bg-warm-50`) + primary maroon + gold accent. No new colours.
- **Typography**:
  - `font-heading` (Playfair Display) for headings, names, prose
  - `font-sans` (Inter) for digits, table data, IDs, timestamps
  - All number displays use `tabular-nums tracking-tight` so digits align in vertical columns
- **Components**: reuse existing `Card`, `Button`, `Badge`, `Dialog`, `Skeleton`, `EmptyState`. No new component vocabulary.
- **Radius**: `rounded-2xl` for cards, `rounded-xl` for inputs/buttons, `rounded-lg` for chips.
- **Shadows**: only `shadow-soft` and `shadow-soft-sm`. Never raw `shadow-md`.
- **Spacing**: `space-y-8` between major sections, `space-y-4` between subsections.

### Interaction rules
- **No animations** on data UI (tables, lists, dashboards). The user explicitly does not want dancing/bouncing elements.
- **Page transitions** can use a single 200ms fade-in on first load only.
- **Hover states** on rows: subtle `hover:bg-warm-50`, no scale/colour-shift.
- **Loading states**: skeleton placeholders, never spinning loaders for full pages.
- **Empty states**: use the existing `EmptyState` component with relevant icon + helpful action.

### Layout rules
- **Desktop-first** for admin (it's a power-user tool). Mobile gets a working but simplified view, not a redesign.
- **Max width** for admin pages: `max-w-7xl` (wider than user-facing `max-w-3xl/5xl`).
- **Sticky header** with admin breadcrumb + role badge.
- **Sidebar nav** on desktop (≥1024px), hamburger drawer on mobile/tablet.
- **Tables**: sticky header row, zebra-stripe with `bg-warm-50/40`, single-row hover highlight.
- **Section dividers**: `border-t border-muted` only — no thick separators.

### Data display rules
- **Numbers**: always `tabular-nums tracking-tight` + `font-sans` (Inter)
- **Dates**: relative for recent (`2h ago`), absolute for older (`23 Apr 2026`)
- **IDs**: monospace + truncate-with-tooltip (`font-mono text-xs`)
- **Currency**: always show full units with no rounding (`£9.99`, never `£10`)
- **Avatars**: `rounded-2xl` (matches user app), 40-48px in tables
- **Status badges**: use existing `Badge` variants (`success`, `warning`, `destructive`, `outline`, `gold`)

### Copy style
- **Action labels**: imperative verb (`Suspend`, `Resolve`, `View`), not gerund (`Suspending`)
- **Confirmation dialogs**: state the consequence, not just the action ("This user will lose access immediately and cannot log in until reactivated.")
- **Empty state copy**: warm, not robotic ("No reports today — your community is healthy.")

### Accessibility
- All admin actions reachable by keyboard
- `aria-label` on icon-only buttons
- Focus rings (`focus-visible:ring-2 ring-primary-500`) preserved
- Colour is never the only signal for status — always paired with icon or text

---

## Auth & Role Model

### Backend changes
Add a `role` field to `AccountRecord`:

```ts
// backend/services/auth/repositories/auth-repository.ts
export interface AccountRecord {
  // ... existing fields
  role?: 'user' | 'admin' | 'moderator';  // default 'user'
  // ...
}
```

Default new accounts to `role = 'user'`. Admins are seeded manually:

```bash
# scripts/promote-admin.ts <env> <userId>
npx tsx scripts/promote-admin.ts prod USR_xxxxxxxx
```

### JWT claim
On token issue (`auth-service.ts:174-181`), include the role:

```ts
const tokenClaims: Record<string, string> = {
  sub: account.userId,
  role: account.role || 'user',
};
```

### Middleware guard
New helper alongside `withAuth`:

```ts
// backend/services/shared/middleware/with-admin.ts
export function withAdmin(handler) {
  return withAuth(async (event, context) => {
    if (event.auth.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }
    return handler(event, context);
  });
}
```

Apply to every admin-only route (e.g. `withAdmin(getAdminUsers)`).

### Frontend role detection
Reuse existing `useMe` hook to fetch `/auth/me`. Backend response gains `role` field. Conditionally render admin nav:

```tsx
const { data: meRes } = useMe();
const isAdmin = meRes?.success && meRes.data.role === 'admin';
if (isAdmin) {
  // show "Admin" link in user menu
}
```

Admin routes guarded by a new `<RequireAdmin>` route component that redirects non-admins to `/dashboard`.

---

## Phase 1 — MVP (200,000 LKR / ~£500 / 2 weeks)

**Goal**: Operations staff can manage users, see reports, and monitor basic health.

### Scope (5 admin screens)

#### 1. Admin Overview (`/admin`)
- Stat cards (4): Total users · Paid users · Reports pending · Signups this week
- Single line chart: signups last 30 days
- Recent activity feed (last 10 admin actions, read-only for now)

#### 2. Users List (`/admin/users`)
- Paginated table (50/page)
- Search by email · phone · name · matrimony ID
- Filter dropdown: All · Active · Suspended · Free · Paid
- Columns: Photo · Name · Age · Plan · Status · Joined
- Click row → side drawer with full profile preview
- Two actions per row: **Suspend** / **Unsuspend**
- Confirmation dialog before suspend

#### 3. User Detail Drawer (slides in from right)
- Profile photo + name + matrimony ID
- Account info: email, phone, plan, signup date, last active
- Quick stats: profiles viewed, interests sent, reports against
- Action buttons: Suspend / Unsuspend, View Public Profile

#### 4. Reports Queue (`/admin/reports`)
- Paginated list of all unresolved reports
- Show: reporter · reported user · reason · date · status
- Two actions: **Mark Resolved** / **Suspend Reported User**
- Filter: Open / Resolved / All

#### 5. Subscriptions List (`/admin/subscriptions`) — read-only
- Paginated table of active + cancelled subscriptions
- Show: user · plan · start date · end date · status · paymentFailing flag
- No edit actions (all subscription edits go via Stripe Dashboard)
- Filter by plan + status

### Backend (4 new endpoints)
```
GET  /admin/overview            → stats + recent activity
GET  /admin/users               → paginated user list with filter/search
PATCH /admin/users/{id}/status  → suspend or unsuspend
GET  /admin/reports             → reports queue with filters
PATCH /admin/reports/{id}       → mark resolved
GET  /admin/subscriptions       → subscriptions list with filters
```

All routes wrapped in `withAdmin` middleware. Frontend uses existing API client.

### File structure (new)
```
backend/services/admin/
├── domain/
│   └── admin-service.ts
├── handlers/
│   ├── get-overview.ts
│   ├── list-users.ts
│   ├── update-user-status.ts
│   ├── list-reports.ts
│   ├── update-report.ts
│   └── list-subscriptions.ts
├── repositories/
│   └── admin-repository.ts
└── index.ts

web/src/features/admin/
├── api/
│   └── admin-api.ts
├── components/
│   ├── AdminLayout.tsx          (sidebar + header for admin pages)
│   ├── AdminStatCard.tsx        (reused stat card with tabular-nums)
│   ├── UsersTable.tsx
│   ├── UserDetailDrawer.tsx
│   ├── ReportsTable.tsx
│   └── SubscriptionsTable.tsx
├── hooks/
│   └── useAdmin.ts
└── pages/
    ├── AdminOverviewPage.tsx
    ├── AdminUsersPage.tsx
    ├── AdminReportsPage.tsx
    └── AdminSubscriptionsPage.tsx
```

### Out of scope (DO NOT BUILD in Phase 1)
- ✗ Photo / profile moderation queue
- ✗ Bulk actions / CSV export
- ✗ Charts beyond the single signup line graph
- ✗ Manual refund processing
- ✗ Multiple admin roles / RBAC
- ✗ Audit log of admin actions
- ✗ Email templates / mass announcements
- ✗ Real-time data refresh
- ✗ Mobile-optimized admin (desktop-first; mobile usable but not primary)

### Acceptance criteria
- [ ] An admin user can log in via the standard flow and see "Admin" link in user menu
- [ ] Non-admin users never see admin UI even if they manipulate routes
- [ ] All 5 pages render with real data
- [ ] Suspend → user immediately loses access, cannot log in
- [ ] Unsuspend → user can log in again
- [ ] Resolve report → disappears from open queue
- [ ] All numbers display with `tabular-nums` Inter font
- [ ] All text headings in Playfair
- [ ] No animations on tables/data
- [ ] Lighthouse score ≥ 90 on admin overview page

### Pricing breakdown
| Item | Hours | Cost |
|---|---|---|
| Backend role system + middleware | 4 | 16k LKR |
| Backend admin endpoints (×6) | 12 | 48k LKR |
| Frontend admin layout + nav | 4 | 16k LKR |
| Overview page + stat cards + chart | 5 | 20k LKR |
| Users page + drawer + actions | 8 | 32k LKR |
| Reports page + actions | 4 | 16k LKR |
| Subscriptions page (read-only) | 3 | 12k LKR |
| Test + deploy + handover | 4 | 16k LKR |
| Buffer (5%) | ~2 | ~8k LKR |
| **Total** | **~46h** | **~184k LKR** |

Quote at **200,000 LKR** with a 16k buffer for the inevitable small request.

### Payment terms
- 50% (100,000 LKR) on signed quote
- 50% (100,000 LKR) on delivery to staging + smoke test passed
- Source code transfer only after final payment

---

## Phase 2 — Moderation (450,000 LKR / ~£1,125 / 4 weeks)

**Goal**: Maintain platform quality. Catch fake profiles, NSFW photos, and abusive content.

### Scope

#### 1. Photo Moderation Queue (`/admin/moderation/photos`)
- Photos pending review (uploaded but not yet shown publicly)
- Approve / Reject / Reject + Suspend user
- Auto-flag photos via AWS Rekognition (NSFW, violence, suggestive)
- Side-by-side compare with other photos in user's profile
- Bulk approve (up to 20 at once)

#### 2. Profile Moderation (`/admin/moderation/profiles`)
- Profiles flagged by users or auto-flagged by content rules
- Review flagged fields (about-me, occupation, photos)
- Approve / Edit / Suspend user
- Pattern detection (same name/email used elsewhere, suspicious bio)

#### 3. Success Story Approval (`/admin/success-stories`)
- Pending stories from `POST /my-story`
- Approve / Reject / Edit before publishing
- Featured toggle (which story shows on landing page)

#### 4. Audit Log (`/admin/audit`)
- Every admin action logged: who · what · when · target
- Filter by admin user · date · action type
- Read-only — for accountability and incident review

### Backend additions
- `POST /admin/photos/{id}/approve` and `/reject`
- `POST /admin/profiles/{id}/moderate`
- `POST /admin/success-stories/{id}/approve`
- New table or partition: `AUDIT#{date}` rows for every admin write
- AWS Rekognition integration in upload pipeline (auto-flag uploads)

### Pricing breakdown
| Item | Cost |
|---|---|
| Backend moderation endpoints | 80k LKR |
| Photo moderation UI + bulk actions | 100k LKR |
| Profile moderation UI | 60k LKR |
| Success story approval flow | 30k LKR |
| Audit log table + UI | 50k LKR |
| AWS Rekognition integration | 60k LKR |
| Pattern detection rules | 40k LKR |
| Test + deploy | 30k LKR |
| **Total** | **~450k LKR** |

---

## Phase 3 — Communications (350,000 LKR / ~£875 / 3 weeks)

**Goal**: Engage users at scale. Send announcements, segmented emails, in-app banners.

### Scope

#### 1. Platform Announcements (`/admin/announcements`)
- Compose announcement (title, body, optional CTA)
- Schedule for now or future date
- Send to all users / paid users / specific country / signup-week cohort
- Preview before sending
- View past announcements + stats (open rate, click rate)

#### 2. Email Templates (`/admin/templates`)
- Edit existing transactional emails (OTP, payment-failed, welcome)
- Custom templates for one-off campaigns
- Variable substitution preview ({{name}}, {{plan}})
- Test send to a specific email

#### 3. In-App Banners (`/admin/banners`)
- Show a dismissable banner across the app (free user only / all users / specific countries)
- Style options: info / warning / promo
- Active dates + max-impressions
- A/B test two banner variants

#### 4. Push Notifications (`/admin/push`)
- If you've integrated mobile push (Web Push or APNS/FCM later)
- Send to segments
- Schedule + preview

### Backend additions
- `POST /admin/announcements` + scheduler (EventBridge)
- `GET/PATCH /admin/email-templates`
- `GET/POST /admin/banners`
- `POST /admin/push` (depends on push infra existing)

### Pricing breakdown
| Item | Cost |
|---|---|
| Announcement compose + scheduler | 80k LKR |
| Cohort/segment query engine | 60k LKR |
| Email template editor (basic WYSIWYG) | 80k LKR |
| In-app banner system (frontend + backend) | 70k LKR |
| Push notifications (if applicable) | 60k LKR |
| **Total** | **~350k LKR** |

---

## Phase 4 — Analytics (400,000 LKR / ~£1,000 / 3-4 weeks)

**Goal**: Business intelligence. Cohort retention, conversion funnels, revenue trends.

### Scope

#### 1. Conversion Funnel (`/admin/analytics/funnel`)
- Visitor → Signup → Profile complete → First interest → First message → Paid
- See drop-off at each step
- Filter by signup week / country / acquisition channel

#### 2. Cohort Retention (`/admin/analytics/cohorts`)
- Week-over-week retention chart by signup cohort
- Identify which cohorts churn fastest

#### 3. Revenue Dashboard (`/admin/analytics/revenue`)
- MRR / ARR with trend chart
- Plan-mix breakdown (Silver/Gold/Platinum)
- Churn rate (cancellations + payment failures)
- LTV calculation
- Refund tracking

#### 4. Geographic Distribution (`/admin/analytics/geo`)
- Map of users by country
- Top cities for matches
- Cross-country interest patterns (UK→India, etc.)

#### 5. Most-Used Filters (`/admin/analytics/preferences`)
- What religion/caste/age combos do users search most?
- Helps you understand audience and pre-populate filters

### Pricing breakdown
| Item | Cost |
|---|---|
| Funnel analytics (event tracking) | 100k LKR |
| Cohort retention queries + chart | 80k LKR |
| Revenue dashboard with MRR/ARR/churn | 100k LKR |
| Geographic visualisation | 60k LKR |
| Filter usage analysis | 40k LKR |
| Charts library + theme integration | 20k LKR |
| **Total** | **~400k LKR** |

---

## Phase 5 — Operations (550,000 LKR / ~£1,375 / 4-5 weeks)

**Goal**: Power-user tools for a growing operations team.

### Scope

#### 1. RBAC — Multiple Admin Roles
- `super_admin`: everything
- `admin`: most things, no role management
- `moderator`: content + reports only, no user data exports
- `support`: read-only, can suspend users
- Role assignment UI (super_admin only)

#### 2. Manual Refund Processing
- Initiate Stripe refund from admin (full or partial)
- Reason code + admin notes
- Auto-update subscription record
- Refund history per user

#### 3. Bulk Actions + CSV Export
- Select multiple users → bulk suspend / bulk email / bulk export
- Download CSV of users / subscriptions / reports / interests
- GDPR-compliant data export per user

#### 4. Bot Detection Rules Engine
- Define rules (signup velocity, suspicious patterns, IP patterns)
- Auto-suspend matching accounts
- Alert admin for review

#### 5. A/B Testing Framework
- Define experiments (paywall variant A vs B)
- Assign users to cohorts
- Compare conversion outcomes
- Promote winning variant

### Pricing breakdown
| Item | Cost |
|---|---|
| RBAC system + role management UI | 120k LKR |
| Refund processing + Stripe integration | 100k LKR |
| Bulk actions + CSV export | 80k LKR |
| GDPR data export tooling | 60k LKR |
| Bot detection rules engine | 100k LKR |
| A/B testing framework | 90k LKR |
| **Total** | **~550k LKR** |

---

## Total Roadmap Cost

| Phase | Cost (LKR) | Cost (£) | Weeks |
|---|---|---|---|
| Phase 1 — MVP | 200,000 | £500 | 2 |
| Phase 2 — Moderation | 450,000 | £1,125 | 4 |
| Phase 3 — Communications | 350,000 | £875 | 3 |
| Phase 4 — Analytics | 400,000 | £1,000 | 3-4 |
| Phase 5 — Operations | 550,000 | £1,375 | 4-5 |
| **Grand Total** | **1,950,000** | **£4,875** | **~17 weeks** |

Phases are independent — client can stop at any phase and have a usable admin. Each phase's UI and code is built so the next phase plugs in cleanly.

---

## Maintenance Bump After Admin Launches

Once Phase 1 ships, increase the monthly retainer:

| Period | Retainer (LKR/month) | What's covered |
|---|---|---|
| Before admin | 50,000 – 100,000 | User-app bug fixes, monitoring |
| After Phase 1 | 100,000 – 150,000 | Above + admin support, small admin tweaks |
| After Phase 3 | 150,000 – 200,000 | Above + announcement campaigns, email template edits |

Any work outside the retainer scope = separate quote.

---

## Implementation Notes (Technical)

### Database changes
- Add `role` field to `AccountRecord` (Phase 1)
- New partition `ADMIN_ACTION#{date}` for audit log (Phase 2)
- New partition `ANNOUNCEMENT#v1` (Phase 3)
- New partition `EXPERIMENT#v1` (Phase 5)

### Migration strategy
- Phase 1 schema change is backwards-compatible (existing users get default role)
- Run `scripts/promote-admin.ts` once after Phase 1 ships to seed first admin
- No data migrations needed for Phase 2-5 (only new tables/partitions)

### Routing (frontend)
```
/admin                          → Overview (Phase 1)
/admin/users                    → Users list (Phase 1)
/admin/reports                  → Reports queue (Phase 1)
/admin/subscriptions            → Subscriptions (Phase 1)
/admin/moderation/photos        → Photo moderation (Phase 2)
/admin/moderation/profiles      → Profile moderation (Phase 2)
/admin/success-stories          → Success story approval (Phase 2)
/admin/audit                    → Audit log (Phase 2)
/admin/announcements            → Announcements (Phase 3)
/admin/templates                → Email templates (Phase 3)
/admin/banners                  → In-app banners (Phase 3)
/admin/analytics/funnel         → Conversion funnel (Phase 4)
/admin/analytics/cohorts        → Retention (Phase 4)
/admin/analytics/revenue        → Revenue (Phase 4)
/admin/settings/roles           → RBAC (Phase 5)
/admin/refunds                  → Refunds (Phase 5)
/admin/experiments              → A/B testing (Phase 5)
```

### Infrastructure
- Add new Lambda function: `lambda_admin` packaged from `backend/services/admin/`
- Add new routes via Terraform
- IAM: admin Lambda needs DDB write + Stripe API access (Phase 5)

---

## Out-of-Scope Forever (do not commit to without separate quote)

These are commonly requested but explicitly OUT for this roadmap:

- ✗ Native mobile admin app (web-only forever)
- ✗ Real-time / live-updating admin dashboards (use polling)
- ✗ Advanced AI moderation (auto-detect bots beyond rules engine)
- ✗ Custom report builder for non-technical staff
- ✗ Multi-tenancy (admin per partner organisation)
- ✗ White-labelling for partners
- ✗ Integration with external CRM (HubSpot, Salesforce)
- ✗ Slack/Teams notifications for admin events
- ✗ Workflow automation (Zapier-style triggers)

If client asks for any of these, quote separately at fair rate.

---

## Owner

This document is maintained by [your name / team]. Update when scope changes or phases ship.

**Last updated**: April 2026
