## Update README

Update `README.md` with the following changes:

- **Live URL** — switch from `https://d2stats-savcoe-dev.lovable.app` to the custom domain `https://d2.savcoe.dev`.
- **Features** — add two new bullets:
  - **Publish verification** — manual "Verify deployment" admin action that fetches the live `index.html`, confirms the React root and bundled script tags are present, and emails the admin if anything is missing.
  - **Transactional email** — branded notifications sent from `mail.d2.savcoe.dev`.
- **Architecture diagram** — add a "Resend / Email" node alongside OpenDota and Steam to reflect the new outbound email path.
- **Engineering Highlights** — add a bullet describing the publish-health check (HTML fetch, content assertions, email alerting via queued send).
- **Project Structure** — under `supabase/functions/`, add:
  - `verify-publish/` — fetches deployed HTML, validates required markers, logs result, queues alert on failure
  - `process-email-queue/` — drains the outbound transactional email queue
- Minor copy polish; keep tone and section order otherwise unchanged.

No code or schema changes — documentation only. After the edit I'll commit it as part of the normal Lovable save flow.
