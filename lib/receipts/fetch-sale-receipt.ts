import { createClient } from "@/lib/supabase/client";
import { getFromStore } from "@/lib/storage/db";
import {
  mapSaleReceiptDetail,
  type SaleReceiptDetailPayload,
} from "@/lib/receipts/sale-receipt";
import type { CompletedReceipt } from "@/types/pos";

export async function fetchSaleReceiptFromServer(
  saleId: string,
): Promise<CompletedReceipt> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_sale_receipt_detail", {
    p_sale_id: saleId,
  });
  if (error) throw error;
  if (!data) throw new Error("Receipt not found.");
  return mapSaleReceiptDetail(data as SaleReceiptDetailPayload);
}

export async function fetchSaleReceipt(saleId: string): Promise<CompletedReceipt> {
  const cached = await getFromStore<CompletedReceipt>("receipts", saleId);
  if (cached?.receiptNumber) {
    try {
      return await fetchSaleReceiptFromServer(saleId);
    } catch {
      return cached;
    }
  }
  return fetchSaleReceiptFromServer(saleId);
}
