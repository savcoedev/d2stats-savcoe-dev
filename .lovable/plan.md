# Verify Published Site

Add an admin-only button on the dashboard that fetches the live site, checks the served HTML, and emails you if anything is missing. This catches the exact failure mode you just hit (empty `<div id="root">` with no script tag).

## How it will work

1. You click **Verify Published Site** on the dashboard.
2. An edge function fetches `https://d2.savcoe.dev/` server-side.
3. It checks the returned HTML for required markers.
4. If anything is missing, it emails you and shows a red result card. If everything passes, it shows a green result card.

## Required HTML markers (all must be present)

- HTTP status `200`
- `<div id="root">` element
- `<script type="module" src="/src/main.tsx"` OR a built `/assets/index-*.js` script tag (production builds rewrite the dev path)
- `<title>` tag with non-empty content
- `<meta name="description"` tag
- Response body length > 500 bytes (sanity check against the empty shell case)

The check explicitly flags the failure pattern you hit: HTML present but no `<script>` tag inside `<body>`.

## What gets built

### 1. Email setup (prerequisite)

Sending email requires a verified sender domain. The first step in the build will be a one-time domain setup so alerts can be sent from `notify@savcoe.dev` (or a subdomain you choose). You'll go through a short setup dialog to add NS records at your DNS provider — after that, alerting works automatically.

### 2. Edge function: `verify-published-site`

- Validates the caller is an authenticated admin (see admin role section below).
- Fetches `https://d2.savcoe.dev/` with a 10s timeout and cache-busting header.
- Runs all marker checks listed above.
- On failure: sends an email to your account with the URL, failed checks, HTTP status, and a snippet of the returned HTML.
- Returns `{ ok: boolean, checks: [{name, passed, detail}], fetchedAt, status }`.

### 3. Database: admin role + check log

- New `app_role` enum (`admin`, `user`) and `user_roles` table with `has_role()` security-definer function (per the standard role pattern — never store role on profiles).
- New `publish_check_log` table: `id, checked_at, ok, http_status, failed_checks jsonb, html_size`. Stores history of every check (manual runs only) so you can see when breakage started.
- You'll be seeded as `admin` once during the migration (using your existing user id).

### 4. UI: Admin section on Dashboard

- A new collapsible "Admin Tools" card visible only to users with the `admin` role.
- "Verify Published Site" button → calls the edge function, shows loading spinner, then a result panel:
  - Green check + "All markers present" on success.
  - Red X + bulleted list of failed checks on failure, plus a note that an email alert was sent.
- Below the button: a small table of the last 10 checks from `publish_check_log` (timestamp, status, failed-check count).

## Files to add/change

```text
supabase/functions/verify-published-site/index.ts   (new)
supabase/migrations/<ts>_admin_role_and_check_log.sql  (new)
src/components/dashboard/AdminTools.tsx              (new)
src/pages/Dashboard.tsx                              (mount AdminTools when admin)
src/contexts/AuthContext.tsx                         (expose isAdmin flag)
```

## Out of scope (can add later if you want)

- Scheduled cron monitoring (you chose manual-only for now).
- Checking the `.lovable.app` fallback URL (custom domain only for now).
- SMS/Slack alerts.
- Auto-republish on failure (Lovable's publish flow isn't programmatically triggerable from an edge function).

## Notes

- This does not prevent broken publishes — it detects them. The fix when it alerts is still to click **Publish → Update** in the Lovable editor.
- Email alerts go through Lovable's built-in email system, so no third-party API keys are needed.
