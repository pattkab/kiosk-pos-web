import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  ProductFormValues,
  CategoryFormValues,
  AdjustmentFormValues,
} from "@/validators/inventory";
import { Database } from "@/types/database";
import { useOrganizationStore } from "@/store/use-organization-store";
import { getAllFromStore, bulkPutInStore } from "@/lib/storage/db";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { invalidateInventoryProducts } from "@/lib/inventory/invalidate-products";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Transaction =
  Database["public"]["Tables"]["inventory_transactions"]["Row"];

export function useProducts(filters: {
  search?: string;
  category_id?: string | null;
  stock?: "all" | "low" | "out";
  status?: "all" | "active" | "inactive";
}) {
  const supabase = createClient();
  const activeOrganizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  return useQuery({
    queryKey: ["products", activeOrganizationId, filters],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (activeOrganizationId)
        query = query.eq("organization_id", activeOrganizationId);

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`,
        );
      }

      if (filters.category_id) {
        query = query.eq("category_id", filters.category_id);
      }

      if (filters.status === "active") query = query.eq("is_active", true);
      if (filters.status === "inactive") query = query.eq("is_active", false);

      if (filters.stock === "out") query = query.eq("stock_quantity", 0);

      const { data, error } = await query;
      if (error) throw error;
      if (filters.stock === "low") {
        return data.filter(
          (product) =>
            Number(product.stock_quantity ?? 0) > 0 &&
            Number(product.stock_quantity ?? 0) <=
              Number(product.low_stock_threshold ?? 0),
        );
      }

      return data;
    },
  });
}

export function useCategories() {
  const supabase = createClient();
  const activeOrganizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );
  return useQuery({
    queryKey: ["categories", activeOrganizationId],
    queryFn: async () => {
      const isOnline = useConnectivityStore.getState().status !== "offline";

      if (!isOnline) {
        console.log(
          "[useCategories] Device offline: loading categories from IndexedDB cache.",
        );
        return await getAllFromStore<Category>("categories");
      }

      try {
        let query = supabase
          .from("categories")
          .select("*")
          .order("description")
          .order("name");
        if (activeOrganizationId)
          query = query.eq("organization_id", activeOrganizationId);
        const { data, error } = await query;
        if (error) throw error;

        // Cache categories locally
        if (data && data.length > 0) {
          await bulkPutInStore("categories", data);
        }

        return data as Category[];
      } catch (error) {
        console.warn(
          "[useCategories] Online fetch failed, falling back to IndexedDB cache:",
          error,
        );
        return await getAllFromStore<Category>("categories");
      }
    },
  });
}

export function useProductMutations() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const activeOrganizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  const createProduct = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (!activeOrganizationId)
        throw new Error("Select an organization before creating products.");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to create products.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (profileError) throw profileError;

      // Keep the user-selected intake date on the product record and the initial stock ledger entry.
      const { addition_date, ...productData } = values;
      const addedAt = addition_date
        ? `${addition_date}T00:00:00.000Z`
        : new Date().toISOString();

      const { data, error } = await supabase
        .from("products")
        .insert({
          ...productData,
          organization_id: activeOrganizationId,
          created_by: profile.id,
          created_at: addedAt,
        })
        .select()
        .single();
      if (error) throw error;

      // If initial stock is > 0, record an initial 'purchase' transaction
      if (data.stock_quantity > 0) {
        await supabase.from("inventory_transactions").insert({
          organization_id: activeOrganizationId,
          product_id: data.id,
          quantity_change: data.stock_quantity,
          transaction_type: "purchase",
          notes: "Initial stock addition",
          performed_by: profile.id,
          created_at: addedAt,
        });
      }

      return data;
    },
    onSuccess: () => {
      invalidateInventoryProducts(queryClient);
      toast.success("Product created successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateProduct = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: ProductFormValues;
    }) => {
      if (!activeOrganizationId)
        throw new Error("Select an organization before updating products.");
      const { addition_date, ...productData } = values;
      const { data, error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", id)
        .eq("organization_id", activeOrganizationId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateInventoryProducts(queryClient);
      toast.success("Product updated successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      if (!activeOrganizationId)
        throw new Error("Select an organization before deleting products.");
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
        .eq("organization_id", activeOrganizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateInventoryProducts(queryClient);
      toast.success("Product deleted");
    },
  });

  return { createProduct, updateProduct, deleteProduct };
}

export function useInventoryAdjustment() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const activeOrganizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  return useMutation({
    mutationFn: async (values: AdjustmentFormValues) => {
      if (!activeOrganizationId)
        throw new Error("Select an organization before adjusting stock.");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to adjust inventory.");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (profileError) throw profileError;

      const { adjustment_date, expiry_date, ...adjustmentData } = values;
      const quantityChange = Number(adjustmentData.quantity_change);
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", values.product_id)
        .eq("organization_id", activeOrganizationId)
        .single();
      if (productError) throw productError;
      const newStock = (product?.stock_quantity || 0) + quantityChange;
      if (newStock < 0) {
        throw new Error(
          "Stock cannot go below zero. Reduce the quantity and try again.",
        );
      }

      const { error: txError } = await supabase
        .from("inventory_transactions")
        .insert({
          ...adjustmentData,
          quantity_change: quantityChange,
          organization_id: activeOrganizationId,
          performed_by: profile.id,
          created_at: adjustment_date || new Date().toISOString(),
        });
      if (txError) throw txError;

      const productUpdate: {
        stock_quantity: number;
        expiry_date?: string | null;
      } = { stock_quantity: newStock };
      if (
        expiry_date &&
        ["purchase", "return", "adjustment"].includes(values.transaction_type)
      ) {
        productUpdate.expiry_date = expiry_date;
      }

      const { error: prodError } = await supabase
        .from("products")
        .update(productUpdate)
        .eq("id", values.product_id)
        .eq("organization_id", activeOrganizationId);

      if (prodError) throw prodError;
    },
    onSuccess: () => {
      invalidateInventoryProducts(queryClient);
      queryClient.invalidateQueries({ queryKey: ["inventory-history"] });
      toast.success("Stock adjusted successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });
}
