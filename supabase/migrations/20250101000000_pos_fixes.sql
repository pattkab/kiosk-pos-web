-- RLS Policies for cash_registers
-- These were missing in the initial schema

-- Members can view cash registers in their organization
DROP POLICY IF EXISTS "Members can view cash registers" ON public.cash_registers;
CREATE POLICY "Members can view cash registers" ON public.cash_registers
FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

-- Managers and above can manage cash registers
DROP POLICY IF EXISTS "Managers can manage cash registers" ON public.cash_registers;
CREATE POLICY "Managers can manage cash registers" ON public.cash_registers
FOR ALL USING (
    organization_id IN (SELECT get_user_organizations())
) WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
);

-- Ensure register_sessions has correct policies for insertion
DROP POLICY IF EXISTS "Members can manage sessions" ON register_sessions;
CREATE POLICY "Members can manage sessions" ON register_sessions
FOR ALL USING (
    organization_id IN (SELECT get_user_organizations())
) WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
);
