## Problem

The Steam login URL `https://d2.savcoe.dev` returns "Invalid redirect_uri" because the custom domain isn't in the allowlist inside `supabase/functions/steam-auth/index.ts`. Only the Lovable preview/published domains and localhost are currently permitted.

## Fix

Add `https://d2.savcoe.dev` to the `DEFAULT_ALLOWED_ORIGINS` array in `supabase/functions/steam-auth/index.ts`, then redeploy the `steam-auth` edge function.

### File change

`supabase/functions/steam-auth/index.ts` — extend `DEFAULT_ALLOWED_ORIGINS`:

```ts
const DEFAULT_ALLOWED_ORIGINS = [
  "https://id-preview--068b2a40-587e-4e39-9099-94c97c507c25.lovable.app",
  "https://d2stats-savcoe-dev.lovable.app",
  "https://d2.savcoe.dev",
  "http://localhost:5173",
  "http://localhost:8080",
];
```

### Deploy

Redeploy `steam-auth` so the new allowlist takes effect, then retry Sign in with Steam from `https://d2.savcoe.dev`.
