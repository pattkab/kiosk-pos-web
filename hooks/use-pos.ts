import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/use-cart-store";
import { useSessionStore } from "@/store/use-session-store";
import { CheckoutPayment, CompletedReceipt, PosProduct } from "@/types/pos";
import { toast } from "sonner";
import { useOrganizationStore } from "@/store/use-organization-store";
import {
  getMetadata,
  saveMetadata,
  getFromStore,
  putInStore,
  bulkPutInStore,
  getOfflineProducts,
} from "@/lib/storage/db";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { ROLE_PERMISSIONS, RolePermissionMap, resolveRolePermissions } from "@/lib/auth/permissions";
import { OrganizationWithRole } from "@/hooks/use-organization";

export function useCurrentPosContext() {
  const supabase = createClient();
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);
  const setActiveOrganizationId = useOrganizationStore((state) => state.setActiveOrganizationId);
  const setActiveCurrency = useOrganizationStore((state) => state.setActiveCurrency);
  const setPermissionState = useOrganizationStore((state) => state.setPermissionState);

  return useQuery({
    queryKey: ["pos-context", activeOrganizationId],
    queryFn: async () => {
      const isOnline = useConnectivityStore.getState().status !== "offline";

      if (!isOnline) {
        const cached = await getMetadata("pos-context");
        if (cached) return cached;
        throw new Error("Organization context is not cached offline.");
      }

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error("You must be signed in to use POS.");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("auth_user_id", user.id)
          .single();
        if (profileError) throw profileError;

        const { data: organizationRows, error: organizationsError } = await supabase.rpc("list_my_organizations");
        if (organizationsError) throw organizationsError;
        const organizations = (organizationRows ?? []) as OrganizationWithRole[];

        const organization =
          organizations?.find((entry) => entry.id === activeOrganizationId) ?? organizations?.[0] ?? null;
        if (!organization) throw new Error("No active organization found. Select or create an organization first.");

        if (organization.id !== activeOrganizationId) setActiveOrganizationId(organization.id);
        setActiveCurrency(organization.currency);
        setPermissionState(organization.role, ROLE_PERMISSIONS[organization.role]);
        try {
          const { data: settingRow } = await supabase
            .from("organization_settings")
            .select("role_permissions")
            .eq("organization_id", organization.id)
            .maybeSingle();
          const rolePermissionMap = (settingRow?.role_permissions ?? null) as RolePermissionMap | null;
          setPermissionState(
            organization.role,
            resolveRolePermissions(organization.role, rolePermissionMap)
          );
        } catch {
          // Keep default role permissions when organization overrides are unavailable.
        }

        const result = {
          profile,
          organization,
          organizationId: organization.id,
          role: organization.role,
        };

        // Cache the context for offline fallbacks
        await saveMetadata("pos-context", result);
        return result;
      } catch (error) {
        const cached = await getMetadata("pos-context");
        if (cached) return cached;
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePosProducts(filters: {
  search?: string;
  categoryId?: string | null;
  limit?: number;
}) {
  const supabase = createClient();
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);

  return useQuery({
    queryKey: ["pos-products", activeOrganizationId, filters],
    queryFn: async () => {
      const isOnline = useConnectivityStore.getState().status !== "offline";

      if (!isOnline) {
        console.log("[usePosProducts] Device offline: loading from IndexedDB cache.");
        return await getOfflineProducts({
          search: filters.search,
          categoryId: filters.categoryId,
        });
      }

      try {
        let query = supabase
          .from("products")
          .select("*, categories(name)")
          .eq("is_active", true)
          .order("name", { ascending: true })
          .limit(filters.limit ?? 80);
        if (activeOrganizationId) query = query.eq("organization_id", activeOrganizationId);

        if (filters.search?.trim()) {
          const term = filters.search.trim().replaceAll(",", " ");
          query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,barcode.ilike.%${term}%`);
        }

        if (filters.categoryId) query = query.eq("category_id", filters.categoryId);

        const { data, error } = await query;
        if (error) throw error;

        // Sync with IndexedDB
        if (data && data.length > 0) {
          await bulkPutInStore("products", data);
        }

        return (data ?? []) as PosProduct[];
      } catch (error) {
        console.warn("[usePosProducts] Online fetch failed, falling back to IndexedDB catalog cache:", error);
        return await getOfflineProducts({
          search: filters.search,
          categoryId: filters.categoryId,
        });
      }
    },
    staleTime: 20 * 1000,
  });
}

export function useBarcodeLookup() {
  const supabase = createClient();
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: async (barcode: string) => {
      if (!activeOrganizationId) throw new Error("Select an organization before scanning products.");
      const isOnline = useConnectivityStore.getState().status !== "offline";

      if (!isOnline) {
        console.log("[useBarcodeLookup] Device offline: searching IndexedDB cache.");
        const products = await getOfflineProducts();
        const match = products.find(
          (p) =>
            p.barcode === barcode ||
            p.sku === barcode ||
            p.barcode?.toLowerCase() === barcode.toLowerCase() ||
            p.sku?.toLowerCase() === barcode.toLowerCase()
        );
        if (!match) throw new Error(`No active product found for ${barcode} (Offline).`);
        return match;
      }

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, categories(name)")
          .eq("organization_id", activeOrganizationId)
          .eq("is_active", true)
          .or(`barcode.eq.${barcode},sku.eq.${barcode}`)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error(`No active product found for ${barcode}.`);
        return data as PosProduct;
      } catch (error) {
        console.warn("[useBarcodeLookup] Online lookup failed, falling back to cache:", error);
        const products = await getOfflineProducts();
        const match = products.find(
          (p) => p.barcode === barcode || p.sku === barcode
        );
        if (!match) throw new Error(`No active product found for ${barcode} (Offline fallback).`);
        return match;
      }
    },
  });
}

export function useRegisterSession() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: context } = useCurrentPosContext();
  const { setSession, clearSession } = useSessionStore();

  const activeSession = useQuery({
    queryKey: ["active-register-session", context?.profile.id, context?.organizationId],
    enabled: Boolean(context?.profile.id && context?.organizationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("register_sessions")
        .select("*, cash_registers(name)")
        .eq("organization_id", context!.organizationId)
        .eq("cashier_id", context!.profile.id)
        .is("closed_at", null)
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      if (!data) {
        clearSession();
        return null;
      }

      const session = {
        id: data.id,
        register_id: data.register_id,
        register_name: Array.isArray(data.cash_registers)
          ? data.cash_registers[0]?.name ?? "Main Register"
          : data.cash_registers?.name ?? "Main Register",
        opened_at: data.opened_at ?? new Date().toISOString(),
        opening_balance: Number(data.opening_balance),
        cashier_id: data.cashier_id,
        organization_id: data.organization_id,
      };
      setSession(session);
      return session;
    },
  });

  const openRegister = useMutation({
    mutationFn: async (openingBalance: number) => {
      if (!context) throw new Error("Organization context is not ready.");

      let { data: register, error: registerError } = await supabase
        .from("cash_registers")
        .select("id, name")
        .eq("organization_id", context.organizationId)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (registerError) throw registerError;

      if (!register) {
        const { data: createdRegister, error: createRegisterError } = await supabase
          .from("cash_registers")
          .insert({ organization_id: context.organizationId, name: "Main Register" })
          .select("id, name")
          .single();
        if (createRegisterError) throw createRegisterError;
        register = createdRegister;
      }

      const { data, error } = await supabase
        .from("register_sessions")
        .insert({
          organization_id: context.organizationId,
          register_id: register.id,
          cashier_id: context.profile.id,
          opening_balance: openingBalance,
        })
        .select()
        .single();
      if (error) throw error;

      return {
        id: data.id,
        register_id: data.register_id,
        register_name: register.name,
        opened_at: data.opened_at ?? new Date().toISOString(),
        opening_balance: Number(data.opening_balance),
        cashier_id: data.cashier_id,
        organization_id: data.organization_id,
      };
    },
    onSuccess: (session) => {
      setSession(session);
      queryClient.invalidateQueries({ queryKey: ["active-register-session"] });
      toast.success("Register opened");
    },
    onError: (error) => toast.error(error.message),
  });

  const closeRegister = useMutation({
    mutationFn: async ({ actualClosingBalance, notes }: { actualClosingBalance: number; notes?: string }) => {
      const session = useSessionStore.getState().currentSession;
      if (!session) throw new Error("No active register session.");

      const { data: cashSales, error: cashError } = await supabase
        .from("payments")
        .select("amount, sales!inner(session_id)")
        .eq("payment_method", "cash")
        .eq("sales.session_id", session.id)
        .eq("status", "completed");
      if (cashError) throw cashError;

      const expectedClosing =
        session.opening_balance + (cashSales ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);

      const { data, error } = await supabase
        .from("register_sessions")
        .update({
          closed_at: new Date().toISOString(),
          closing_balance: expectedClosing,
          actual_closing_balance: actualClosingBalance,
          discrepancy: actualClosingBalance - expectedClosing,
          notes,
        })
        .eq("id", session.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      clearSession();
      queryClient.invalidateQueries({ queryKey: ["active-register-session"] });
      toast.success("Register closed");
    },
    onError: (error) => toast.error(error.message),
  });

  return { activeSession, openRegister, closeRegister };
}

export function useCheckout() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: context } = useCurrentPosContext();

  return useMutation({
    mutationFn: async (payments: CheckoutPayment[]) => {
      const session = useSessionStore.getState().currentSession;
      const { items, getTotals, validateCart } = useCartStore.getState();
      const totals = getTotals();
      const errors = validateCart();

      const isOnline = useConnectivityStore.getState().status !== "offline";
      let activeContext = context;
      let activeSession = session;

      if (!isOnline) {
        activeContext = await getMetadata("pos-context");
        activeSession = useSessionStore.getState().currentSession;
      }

      if (!activeContext) throw new Error("Organization context is not ready.");
      if (!activeSession) throw new Error("Open a register before checkout.");
      if (items.length === 0) throw new Error("Cart is empty.");
      if (errors.length > 0) throw new Error(errors[0]);
      if (!useOrganizationStore.getState().permissions.includes("pos.checkout")) {
        throw new Error("You do not have permission to complete checkout.");
      }

      const { data: receiptSettingsRow } = await supabase
        .from("organization_settings")
        .select("receipt_header, receipt_footer, receipt_logo_url, receipt_notes")
        .eq("organization_id", activeContext.organizationId)
        .maybeSingle();

      const receiptBranding = {
        receiptHeader: receiptSettingsRow?.receipt_header ?? null,
        receiptFooter: receiptSettingsRow?.receipt_footer ?? null,
        receiptLogoUrl: receiptSettingsRow?.receipt_logo_url ?? null,
        receiptNotes: receiptSettingsRow?.receipt_notes ?? null,
      };

      const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      if (paid + 0.01 < totals.total) throw new Error("Payment total is less than amount due.");

      const rpcItems = items.map((item) => {
        const lineSubtotal = item.unit_price * item.quantity;
        const lineDiscount =
          item.discount?.type === "percentage"
            ? lineSubtotal * Math.min(item.discount.value, 100) / 100
            : Math.min(item.discount?.value ?? 0, lineSubtotal);
        const lineTaxBase = Math.max(0, lineSubtotal - lineDiscount);
        const lineTax =
          item.tax_mode === "inclusive"
            ? lineTaxBase - lineTaxBase / (1 + item.tax_rate)
            : lineTaxBase * item.tax_rate;

        return {
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_cost: item.unit_cost,
          discount_amount: Number(lineDiscount.toFixed(2)),
          tax_amount: Number(lineTax.toFixed(2)),
          line_total: Number(Math.max(0, lineSubtotal - lineDiscount).toFixed(2)),
          note: item.note || null,
        };
      });

      const rpcPayments = payments.map((payment) => ({
        payment_method: payment.payment_method,
        amount: payment.amount,
        reference: payment.reference || null,
      }));

      if (!isOnline) {
        console.log("[useCheckout] Device offline: intercepting and queuing transaction.");
        const tempSaleId = crypto.randomUUID();
        const receiptNumber = `R-OFF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // Deduct stock quantities in local IndexedDB product cache
        for (const item of items) {
          const cachedProd = await getFromStore<PosProduct>("products", item.product_id);
          if (cachedProd) {
            const newStock = Math.max(0, (cachedProd.stock_quantity ?? 0) - item.quantity);
            await putInStore<PosProduct>("products", { ...cachedProd, stock_quantity: newStock });
          }
        }

        const receipt: CompletedReceipt = {
          saleId: tempSaleId,
          receiptNumber,
          organizationName: activeContext.organization?.name ?? "Store",
          cashierName: activeContext.profile.full_name ?? activeContext.profile.email,
          createdAt: new Date().toISOString(),
          items,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountTotal,
          totalAmount: totals.total,
          payments,
          changeDue: Math.max(0, payments.reduce((sum, p) => sum + p.amount, 0) - totals.total),
          ...receiptBranding,
        };

        // Save receipt to local store
        await putInStore("receipts", receipt);

        // Queue for background sync
        const queueItem = {
          id: tempSaleId,
          organizationId: activeContext.organizationId,
          cashierId: activeContext.profile.id,
          sessionId: activeSession.id,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountTotal,
          totalAmount: totals.total,
          items: rpcItems,
          payments: rpcPayments,
          createdAt: new Date().toISOString(),
        };

        await useOfflineQueueStore.getState().enqueueSale(queueItem);

        toast.info("Offline mode active: Sale completed and queued for sync.");
        return receipt;
      }

      const { data: saleId, error } = await supabase.rpc("process_checkout", {
        p_organization_id: activeContext.organizationId,
        p_cashier_id: activeContext.profile.id,
        p_session_id: activeSession.id,
        p_customer_id: null,
        p_subtotal: totals.subtotal,
        p_tax_amount: totals.taxAmount,
        p_discount_amount: totals.discountTotal,
        p_total_amount: totals.total,
        p_items: rpcItems,
        p_payments: rpcPayments,
      });
      if (error) throw error;

      const receipt: CompletedReceipt = {
        saleId: saleId as string,
        receiptNumber: `R-${String(saleId).slice(0, 8).toUpperCase()}`,
        organizationName: activeContext.organization?.name ?? "Store",
        cashierName: activeContext.profile.full_name ?? activeContext.profile.email,
        createdAt: new Date().toISOString(),
        items,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountTotal,
        totalAmount: totals.total,
        payments,
        changeDue: Math.max(0, payments.reduce((sum, payment) => sum + payment.amount, 0) - totals.total),
        ...receiptBranding,
      };

      // Cache completed online receipts locally as well
      await putInStore("receipts", receipt);

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
