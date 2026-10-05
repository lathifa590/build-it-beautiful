DROP POLICY IF EXISTS "Invited user views own invite" ON public.agency_invites;

CREATE POLICY "Invited user views own invite"
  ON public.agency_invites FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));
