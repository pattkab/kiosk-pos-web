"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useOrganization() {
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).single();
        if (profile) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id, organizations(*)')
            .eq('profile_id', profile.id)
            .single();

          if (member) {
            setOrganization(member.organizations);
          }
        }
      }
      setLoading(false);
    }
    fetchOrg();
  }, [supabase]);

  return { organization, loading };
}
