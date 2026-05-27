-- Explicitly add WITH CHECK to cash_registers and register_sessions
-- to ensure INSERT operations are allowed by RLS

DROP POLICY IF EXISTS "Managers can manage cash registers" ON public.cash_registers;
CREATE POLICY "Managers can manage cash registers" ON public.cash_registers
FOR ALL USING (
    organization_id IN (SELECT get_user_organizations())
) WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
);

DROP POLICY IF EXISTS "Members can manage sessions" ON register_sessions;
CREATE POLICY "Members can manage sessions" ON register_sessions
FOR ALL USING (
    organization_id IN (SELECT get_user_organizations())
) WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
);
