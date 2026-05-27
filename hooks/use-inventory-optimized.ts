"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationStore } from "@/store/use-organization-store";

const PAGE_SIZE = 50;

export function useInfiniteProducts(filters: {
  search?: string;
  categoryId?: string | null;
  status?: 'all' | 'active' | 'inactive';
}) {
  const supabase = createClient();
  const orgId = useOrganizationStore((state) => state.activeOrganizationId);

  return useInfiniteQuery({
    queryKey: ["products-infinite", orgId, filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("products")
        .select("id, name, sku, barcode, selling_price, stock_quantity, low_stock_threshold, is_active, image_url, category_id, categories(name)", { count: 'exact' })
        .eq("organization_id", orgId!)
        .order("name", { ascending: true })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (filters.search?.trim()) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }

      if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      if (filters.status === 'active') query = query.eq('is_active', true);
      if (filters.status === 'inactive') query = query.eq('is_active', false);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data,
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 30000,
    enabled: !!orgId,
  });
}

/**
 * Performance-optimized hook for POS barcode scanning.
 * Uses exact match and selects minimal fields for sub-100ms response.
 */
export function useBarcodeQuickLookup() {
  const supabase = createClient();
  const orgId = useOrganizationStore((state) => state.activeOrganizationId);

  return async (code: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, selling_price, cost_price, stock_quantity, image_url")
      .eq("organization_id", orgId!)
      .or(`barcode.eq.${code},sku.eq.${code}`)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  };
}
