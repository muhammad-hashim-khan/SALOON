-- REVERTED: Do NOT allow anon reads on settings.
-- The correct fix is in the application code (don't query settings before auth session is restored).
-- 
-- Keep settings readable only to authenticated active users (both ADMIN and WORKER roles):
-- - ADMIN: can read + write settings
-- - ACTIVE WORKER: can read settings (needed to display salon name on receipts)
-- - INACTIVE WORKER: no access (blocked by is_active_user())
-- - ANONYMOUS: no access

-- Drop the too-broad anon policy if it was applied previously
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;

-- Recreate the correct policy: authenticated + active users can read settings
CREATE POLICY "Authenticated active users can read settings"
  ON public.settings
  FOR SELECT
  TO authenticated
  USING (public.is_active_user());
