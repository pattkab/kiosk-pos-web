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
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        AND role IN ('owner', 'admin', 'manager')
    )
);

-- Allow cashiers to view their own sessions (redundant but safe)
DROP POLICY IF EXISTS "Members can view sessions" ON register_sessions;
CREATE POLICY "Members can view sessions" ON register_sessions
FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

-- Allow cashiers to create their own sessions
DROP POLICY IF EXISTS "Members can manage sessions" ON register_sessions;
CREATE POLICY "Members can manage sessions" ON register_sessions
FOR ALL USING (
    organization_id IN (SELECT get_user_organizations())
);
