"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import { toast } from "sonner";

export type MyCustomerMembership = {
  customer_id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  full_name: string;
  loyalty_points: number;
  loyalty_card_number: string;
};

export function useMyCustomerMemberships() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["my-customer-memberships"],
    queryFn: async () => {
      await supabase.rpc("ensure_profile_for_current_user");
      const { data, error } = await supabase.rpc("list_my_customer_memberships");
      if (error) throw error;
      return (data ?? []) as MyCustomerMembership[];
    },
  });
}

export function useAcceptCustomerInvitation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc("accept_customer_invitation", {
        p_token: token,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-customer-memberships"] });
      toast.success("Your loyalty card is ready.");
    },
    onError: (error) =>
      toast.error(
        getUserErrorMessage(error, "Could not accept invitation. Try again."),
      ),
  });
}
