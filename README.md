# Kaizen Continuous Improvement Platform

An internal company platform for submitting, discussing, and tracking continuous-improvement ("Kaizen") ideas — with admin-approved sign-up, upvote/downvote, threaded comments, true anonymous posting, and an admin workflow for moving ideas from submission through implementation.

## What's included

- **Sign-up with admin approval** — new accounts sit in `PENDING` until an admin approves them. Admins can also reject or suspend accounts later.
- **Idea submission** with a structured Kaizen template (Problem → Root cause → Proposed solution → Expected benefit), department + category tagging, and an **anonymous option**.
- **Upvote / downvote** (toggleable, one vote per person), locked once an idea reaches a final state.
- **Threaded comments**, also with an anonymous option, plus admin hide/delete moderation.
- **Admin idea lifecycle control**: Submitted → Under review → In progress → Implemented / Rejected / Closed, with an official response field shown to everyone.
- **Departments & categories** management for a multi-department company.
- **Analytics dashboard** (counts by status/department, average days-to-implement, top contributors) and an **audit log** of every admin action.
- **True anonymity** — see below. This isn't a UI label; it's an architectural guarantee.

## The anonymity model (read this before deploying)

You chose **full, irreversible anonymity**: nobody — not other members, not admins, not whoever has direct database access — can connect an anonymous idea or comment back to the person who posted it.

This is implemented structurally, not just with a setting:

- When `isAnonymous` is true, the `authorId` column is simply never written. There is nothing to look up, even at the database level.
- Voting is **not** anonymous (one vote per account is enforced normally) — only *authorship* of ideas/comments can be anonymous, exactly as scoped.
- Because there's no stored link, **the original poster also loses the ability to edit/withdraw their anonymous idea later** — including the poster, with no exceptions. To make that survivable, the app generates a one-time random secret at creation, shown to the poster exactly once, and stores only its bcrypt hash. Whoever holds that raw secret can later edit or delete the idea (or comment); nobody else can, and it cannot be recovered if lost. This is the same trust model as a password-reset link.
- "Top contributors" in analytics only ever counts non-anonymous ideas, so the leaderboard can never be used to deduce who posted anonymously.

If your organization later decides admins *should* be able to unmask anonymous posts for accountability, that's a deliberate, fairly small change (store `authorId` always, but only reveal it in a dedicated admin-only field) — flag it if you want that variant instead.

## Architecture

```
kaizen-platform/
├── backend/     Node.js + Express REST API, PostgreSQL via Prisma, JWT auth (httpOnly cookie)
├── frontend/    React + Vite + Tailwind CSS
└── docker-compose.yml   Local Postgres for development
```

- **Auth**: bcrypt-hashed passwords, JWT in an httpOnly cookie (not localStorage, to reduce XSS exposure), role (`MEMBER`/`ADMIN`) and status (`PENDING`/`APPROVED`/`REJECTED`/`SUSPENDED`) gates on every protected route.
- **Database**: PostgreSQL, schema managed by Prisma migrations (`backend/prisma/schema.prisma`).
- **Rate limiting**: login/signup and all write actions (ideas, comments, votes) are throttled (`express-rate-limit`) to slow down abuse and brute-forcing.
- **Audit log**: every admin action (approvals, rejections, suspensions, status changes, taxonomy edits, comment moderation) is recorded with actor, action, target, and timestamp.

## Local setup

### 1. Database

```bash
docker compose up -d        # starts Postgres on localhost:5432
```

(No Docker? Point `DATABASE_URL` at any Postgres instance instead.)

### 2. Backend

```bash
cd backend
cp .env.example .env        # edit JWT_SECRET, SEED_ADMIN_* etc.
npm install
npm run prisma:migrate      # creates the database tables
npm run seed                # default departments/categories + first admin account
npm run dev                 # http://localhost:4000
```

Generate a strong `JWT_SECRET` with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Log in with the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` you set in `backend/.env`, **then change that password immediately** (there's no self-serve "change password" screen in v1 — see Roadmap — so for now, update it by re-running a password reset directly via Prisma Studio: `npx prisma studio` in `backend/`, or extend the API per the Roadmap below).

## Deploying

A simple, low-maintenance path:

1. **Database**: a managed Postgres — Railway, Render, Supabase, or Neon all have a generous free/low tier.
2. **Backend**: Railway or Render (both deploy a Node app from a Git repo with one click). Set the environment variables from `.env.example` in the host's dashboard. Run `npx prisma migrate deploy && npm run seed` once after the first deploy (most hosts let you run a one-off shell command, or add it as a release step).
3. **Frontend**: Vercel or Netlify. Set `VITE_API_URL` to your deployed backend's URL (e.g. `https://your-api.onrender.com/api`).
4. Set `FRONTEND_URL` in the backend's env to your deployed frontend's exact origin, and `NODE_ENV=production` — this switches the auth cookie to `secure` + `SameSite=None`, which requires HTTPS on both ends (these hosts give you that by default).

## API overview

All endpoints are under `/api`. Auth uses an httpOnly cookie set by `/api/auth/login` — the frontend's axios client is already configured with `withCredentials: true`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Departments/Categories | `GET /departments`, `GET /categories` (public); admin-only `POST`/`DELETE` |
| Ideas | `GET /ideas` (filters: `status`, `departmentId`, `categoryId`, `search`, `sort=new\|top`, `mine=true`), `POST /ideas`, `GET /ideas/:id`, `PUT /ideas/:id`, `DELETE /ideas/:id`, `POST /ideas/:id/status` (admin), `POST /ideas/:id/vote` |
| Comments | `GET /ideas/:ideaId/comments`, `POST /ideas/:ideaId/comments`, `DELETE /comments/:id`, `POST /comments/:id/hide` (admin) |
| Admin | `GET /admin/users`, `POST /admin/users/:id/approve\|reject\|suspend\|reinstate`, `GET /admin/analytics`, `GET /admin/audit-log` |

## Honest limitations of this v1

- No password-reset/forgot-password flow yet (see Roadmap).
- No file attachments on ideas.
- No outbound email (approval/status-change notifications are in-app only — there's nothing to email with, since no email service is wired up).
- Rate limiting is in-memory per server instance; if you run multiple backend instances behind a load balancer, swap in a Redis-backed limiter.

## Roadmap (deliberately left out of v1 to keep scope sane)

These were discussed as valuable additions but not built yet:

- Email notifications (digest of new ideas, approval/status-change alerts) — needs an email service (e.g. Postmark, SES) wired into the approve/reject/status-change controllers.
- Forgot-password flow.
- File/image attachments on ideas (e.g. before/after photos).
- Duplicate-idea detection while typing a new submission.
- Lightweight gamification (points, monthly leaderboard) for non-anonymous contributors.
- Department-level moderators (approve/manage only within their own department).
- CSV export of ideas/analytics for leadership reporting.
- Single sign-on (Google Workspace / Microsoft Entra) instead of email+password.

## Design notes

The status indicator is a small circular badge split into four quadrants — Plan, Do, Check, Act — filled clockwise as an idea moves through its lifecycle, rather than a generic colored pill. It's meant to tie the interface directly to the actual Kaizen/PDCA methodology rather than being decorative. See `frontend/src/components/StatusBadge.jsx`.
