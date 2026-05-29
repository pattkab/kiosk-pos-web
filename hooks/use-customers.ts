"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationStore } from "@/store/use-organization-store";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import { toast } from "sonner";
import type { CustomerFormValues } from "@/validators/loyalty";
import {
  cacheCustomersDelta,
  getOfflineCustomerByLoyaltyCard,
} from "@/lib/offline/customers";
import { normalizeLoyaltyCardNumber } from "@/lib/loyalty/card";
import { useConnectivityStore } from "@/store/use-connectivity-store";

export type CustomerRecord = {
  id: string;
  organization_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  loyalty_points: number;
  loyalty_card_number: string;
  profile_id: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

const customerSelect =
  "id, organization_id, full_name, email, phone, address, loyalty_points, loyalty_card_number, profile_id, status, created_at, updated_at";

export function useCustomerSearch(search: string, enabled = true) {
  const supabase = createClient();
  const organizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  return useQuery({
    queryKey: ["customers-search", organizationId, search],
    enabled: Boolean(organizationId) && enabled,
    queryFn: async () => {
      let query = supabase
        .from("customers")
        .select(customerSelect)
        .eq("organization_id", organizationId!)
        .eq("status", "active")
        .order("full_name", { ascending: true })
        .limit(12);

      const term = search.trim();
      if (term) {
        const normalizedCard = normalizeLoyaltyCardNumber(term);
        query = query.or(
          `full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,loyalty_card_number.eq.${normalizedCard}`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CustomerRecord[];
    },
  });
}

export function useCustomersList() {
  const supabase = createClient();
  const organizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  return useQuery({
    queryKey: ["customers", organizationId],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select(customerSelect)
        .eq("organization_id", organizationId!)
        .eq("status", "active")
        .order("full_name", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as CustomerRecord[];
    },
  });
}

export function useCustomerInvitations() {
  const supabase = createClient();
  const organizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  return useQuery({
    queryKey: ["customer-invitations", organizationId],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invitations")
        .select("id, email, phone, full_name, token, created_at, expires_at, accepted_at, cancelled_at")
        .eq("organization_id", organizationId!)
        .is("cancelled_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCustomerLoyaltyHistory(customerId: string | null) {
  const supabase = createClient();
  const organizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  return useQuery({
    queryKey: ["loyalty-history", organizationId, customerId],
    enabled: Boolean(organizationId && customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select(
          "id, points_delta, balance_after, transaction_type, note, created_at, sale_id",
        )
        .eq("organization_id", organizationId!)
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCustomer() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  return useMutation({
    mutationFn: async (values: CustomerFormValues) => {
      if (!organizationId) throw new Error("No active organization.");
      const { data, error } = await supabase
        .from("customers")
        .insert({
          organization_id: organizationId,
          full_name: values.full_name.trim(),
          phone: values.phone?.trim() || null,
          email: values.email?.trim() || null,
          address: values.address?.trim() || null,
        })
        .select(customerSelect)
        .single();
      if (error) throw error;
      await cacheCustomersDelta([data as CustomerRecord]);
      return data as CustomerRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-search"] });
      toast.success("Customer added");
    },
    onError: (error) =>
      toast.error(
        getUserErrorMessage(error, "Could not create customer. Try again."),
      ),
  });
}

export function useInviteCustomer() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  return useMutation({
    mutationFn: async (values: {
      email?: string;
      phone?: string;
      full_name?: string;
    }) => {
      if (!organizationId) throw new Error("No active organization.");
      const { data, error } = await supabase.rpc("invite_customer", {
        p_organization_id: organizationId,
        p_email: values.email?.trim() || null,
        p_phone: values.phone?.trim() || null,
        p_full_name: values.full_name?.trim() || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.token) throw new Error("Invitation could not be created.");
      return row as { invitation_id: string; token: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-invitations"] });
      toast.success("Customer invitation created");
    },
    onError: (error) =>
      toast.error(
        getUserErrorMessage(error, "Could not invite customer. Try again."),
      ),
  });
}

export function useLoyaltyCustomerLookup() {
  const supabase = createClient();
  const organizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );
  const isOffline = useConnectivityStore((state) => state.status === "offline");

  return useMutation({
    mutationFn: async (rawCode: string) => {
      if (!organizationId) throw new Error("No active organization.");
      const normalized = normalizeLoyaltyCardNumber(rawCode);

      if (isOffline) {
        const cached = await getOfflineCustomerByLoyaltyCard(
          normalized,
          organizationId,
        );
        if (!cached) throw new Error("Loyalty card not found in offline cache.");
        return cached as CustomerRecord;
      }

      const { data, error } = await supabase.rpc("lookup_loyalty_customer", {
        p_organization_id: organizationId,
        p_loyalty_card_number: normalized,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) throw new Error("Loyalty card not found.");
      return row as CustomerRecord;
    },
  });
}
