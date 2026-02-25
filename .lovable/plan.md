

## Fix: Steam Auth "is not valid JSON" Error

### Root Cause

The steam-auth callback flow breaks when:
1. `signInWithPassword` fails (the password is derived from `SUPABASE_SERVICE_ROLE_KEY`, and if the key rotated or changed, existing users can't sign in)
2. `admin.createUser` fails because the user already exists, but the GoTrue admin endpoint returns an HTML error page instead of JSON, causing a parse error

### Fix

Update `supabase/functions/steam-auth/index.ts` to handle the "user already exists" scenario properly:

1. Try `signInWithPassword` first (works for users created with current key)
2. If that fails, use `admin.listUsers` to check if user exists by email
3. If user exists, update their password with `admin.updateUserById`, then sign in again
4. If user truly doesn't exist, create them with `admin.createUser`, then sign in

This makes the auth flow resilient to service role key changes and avoids the HTML error response.

### File Changed

**`supabase/functions/steam-auth/index.ts`** -- lines 75-100 (the auth block):
- Replace the current "try sign in, else create" logic with a 3-step approach:
  - Step A: `signInWithPassword` -- if success, done
  - Step B: `admin.listUsers({ filter: email })` -- check if user exists
  - Step C: If user found, `admin.updateUserById(id, { password })` then retry sign in
  - Step D: If user not found, `admin.createUser(...)` then sign in
- Wrap all admin calls in try/catch to prevent HTML parse errors from crashing the function
- Keep the rest of the function (Steam verification, profile upsert, redirect) unchanged

