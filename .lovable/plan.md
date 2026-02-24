

## Fix: Steam Login Redirect Goes to Wrong Domain

### Problem
After successful Steam authentication, the `steam-auth` edge function redirects to `qwnwxosjpoqlemoxpwuh.supabase.co/#access_token=...` instead of your app URL. This causes the `{"error":"requested path is invalid"}` error.

**Root cause:** Line 122 in `steam-auth/index.ts` uses `url.origin` which is the Supabase function's domain, not your app domain. The `.replace("/functions/v1/steam-auth", "")` call does nothing because `origin` never contains a path.

### Fix

**1. Pass the app origin through the Steam login flow**

Update the `login` action to accept a `redirect_uri` query parameter from the frontend and thread it through Steam's OpenID callback:

```text
Login URL: /steam-auth?action=login&redirect_uri=https://d2stats-savcoe-dev.lovable.app
                                                    |
Callback URL: /steam-auth?action=callback&redirect_uri=https://d2stats-savcoe-dev.lovable.app
                                                    |
Final redirect: https://d2stats-savcoe-dev.lovable.app/#access_token=...&refresh_token=...
```

**2. Update `supabase/functions/steam-auth/index.ts`**

- In the `login` handler: read `redirect_uri` from query params, append it to the `return_to` URL
- In the `callback` handler: read `redirect_uri` from query params, use it as the final redirect origin instead of `url.origin`
- Add a fallback to an environment variable `APP_ORIGIN` if no `redirect_uri` is provided

**3. Update `src/pages/Landing.tsx`**

- Change the Steam login URL to include `redirect_uri` set to `window.location.origin`, so it works correctly in both preview and published environments:

```
const STEAM_LOGIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-auth?action=login&redirect_uri=${encodeURIComponent(window.location.origin)}`;
```

### Files Changed
- `supabase/functions/steam-auth/index.ts` -- thread `redirect_uri` through the OpenID flow and use it for the final redirect
- `src/pages/Landing.tsx` -- pass `window.location.origin` as `redirect_uri`

