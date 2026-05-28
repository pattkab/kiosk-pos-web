"use client";

import { useEffect, useState } from "react";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { SyncEngine } from "@/lib/offline/sync-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, ArrowLeft, CheckCircle, Clock, CloudLightning, Loader2, RefreshCw, Trash2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { putInStore } from "@/lib/storage/db";
import { exportOfflineBackup } from "@/lib/offline/backup";
import {
  formatLastSyncLabel,
  getOfflineSettings,
} from "@/lib/offline/offline-metadata";
import { Download } from "lucide-react";

export default function OfflineQueuePage() {
  const { items, isSyncing, loadQueue, dequeueSale, updateItemStatus } = useOfflineQueueStore();
  const status = useConnectivityStore((state) => state.status);
  const isOnline = status === "online" || status === "limited-functionality";

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [lastSyncLabel, setLastSyncLabel] = useState("Never synced");

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    getOfflineSettings().then((settings) => {
      setLastSyncLabel(formatLastSyncLabel(settings.lastSuccessfulSyncAt));
    });
  }, [items, isSyncing]);

  const handleSyncAll = async () => {
    if (!isOnline) {
      toast.error("You are offline. Cannot sync queue.");
      return;
    }
    toast.promise(SyncEngine.processQueue(), {
      loading: "Processing offline queue sync...",
      success: "Sync processing completed.",
      error: "Sync processing failed.",
    });
  };

  const handleSyncCatalog = async () => {
    if (!isOnline) {
      toast.error("You are offline. Cannot sync catalog.");
      return;
    }
    toast.promise(SyncEngine.syncProductCatalog(), {
      loading: "Refreshing product catalog cache...",
      success: "Product catalog cache updated successfully.",
      error: "Failed to update catalog.",
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = items.find((item) => item.id === id);
    if (!target) return;
    if (target.status === "pending" || target.status === "failed") {
      const typed = prompt(
        "This sale has not synced yet. Type DELETE to remove it from this device (not recommended).",
      );
      if (typed !== "DELETE") return;
    } else if (
      !confirm(
        "Remove this queued record from the device? Synced sales are already on the server.",
      )
    ) {
      return;
    }
    await dequeueSale(id);
    toast.success("Queued transaction removed from this device.");
  };

  const handleExportBackup = async () => {
    try {
      await exportOfflineBackup();
      toast.success("Offline backup downloaded.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not export backup.",
      );
    }
  };

  const handleResolveConflictClick = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(item);
    setResolutionOpen(true);
  };

  const resolveConflictAutoReplenish = async () => {
    if (!selectedItem) return;
    setResolving(true);
    const supabase = createClient();

    try {
      // 1. Identify which product is causing the stock issue from the error message
      const errorMsg = selectedItem.errorMessage || "";
      const match = errorMsg.match(/Insufficient stock for (.*?)\./);
      const productName = match ? match[1] : null;

      let productIdToAdjust: string | null = null;
      let quantityToAdjust = 10; // Default buffer

      if (productName) {
        const itemInCart = selectedItem.items.find(
          (i: any) => i.name.toLowerCase() === productName.toLowerCase()
        );
        if (itemInCart) {
          productIdToAdjust = itemInCart.product_id;
          quantityToAdjust = itemInCart.quantity;
        }
      }

      if (!productIdToAdjust) {
        // Fallback: adjust the first item in the transaction
        productIdToAdjust = selectedItem.items[0]?.product_id;
        quantityToAdjust = selectedItem.items[0]?.quantity || 10;
      }

      if (!productIdToAdjust) {
        throw new Error("Could not determine which product to adjust.");
      }

      console.log(`[ConflictResolve] Adjusting product stock: ${productIdToAdjust} by +${quantityToAdjust}`);

      // 2. Fetch current stock on server to calculate discrepancy
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", productIdToAdjust)
        .single();

      if (fetchError) throw fetchError;

      const serverStock = product?.stock_quantity || 0;
      const additionNeeded = Math.max(0, quantityToAdjust - serverStock) + 5; // Add discrepancy plus 5 buffer

      // 3. Insert inventory transaction to replenish stock
      const { error: txError } = await supabase.from("inventory_transactions").insert({
        organization_id: selectedItem.organizationId,
        product_id: productIdToAdjust,
        quantity_change: additionNeeded,
        transaction_type: "manual",
        notes: `System automatic auto-replenish to resolve offline sync conflict in receipt ${selectedItem.id}`,
        performed_by: selectedItem.cashierId,
      });

      if (txError) throw txError;

      // 4. Update the products stock quantity on server
      const { error: prodError } = await supabase
        .from("products")
        .update({ stock_quantity: serverStock + additionNeeded })
        .eq("id", productIdToAdjust);

      if (prodError) throw prodError;

      // 5. Reset status to pending so it will retry
      await updateItemStatus(selectedItem.id, "pending");
      setResolutionOpen(false);
      toast.success("Server stock replenished! Transaction will be retried automatically.");
      
      // Trigger sync
      SyncEngine.processQueue();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to replenish stock: " + err.message);
    } finally {
      setResolving(false);
    }
  };

  const resolveConflictReduceQuantity = async () => {
    if (!selectedItem) return;
    setResolving(true);
    const supabase = createClient();

    try {
      // 1. Identify product causing conflict
      const errorMsg = selectedItem.errorMessage || "";
      const match = errorMsg.match(/Insufficient stock for (.*?)\./);
      const productName = match ? match[1] : null;

      let targetProduct: any = null;
      if (productName) {
        targetProduct = selectedItem.items.find(
          (i: any) => i.name.toLowerCase() === productName.toLowerCase()
        );
      } else {
        targetProduct = selectedItem.items[0];
      }

      if (!targetProduct) {
        throw new Error("Could not find product in transaction.");
      }

      // 2. Fetch server stock
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", targetProduct.product_id)
        .single();

      if (fetchError) throw fetchError;
      const serverStock = product?.stock_quantity || 0;

      if (serverStock <= 0) {
        throw new Error("Server stock is 0. Cannot reduce to positive quantity. Please replenish stock or delete the sale.");
      }

      // 3. Update the item quantity in local queue store
      const updatedItems = selectedItem.items.map((i: any) => {
        if (i.product_id === targetProduct.product_id) {
          const discountPerUnit = i.discount_amount / i.quantity;
          const taxPerUnit = i.tax_amount / i.quantity;
          return {
            ...i,
            quantity: serverStock,
            discount_amount: Number((discountPerUnit * serverStock).toFixed(2)),
            tax_amount: Number((taxPerUnit * serverStock).toFixed(2)),
            line_total: Number((i.unit_price * serverStock - discountPerUnit * serverStock).toFixed(2)),
          };
        }
        return i;
      });

      // Recalculate totals
      const newSubtotal = updatedItems.reduce((sum: number, i: any) => sum + i.unit_price * i.quantity, 0);
      const newDiscount = updatedItems.reduce((sum: number, i: any) => sum + i.discount_amount, 0);
      const newTax = updatedItems.reduce((sum: number, i: any) => sum + i.tax_amount, 0);
      const newTotal = newSubtotal - newDiscount + newTax;

      const updatedItem = {
        ...selectedItem,
        items: updatedItems,
        subtotal: Number(newSubtotal.toFixed(2)),
        discountAmount: Number(newDiscount.toFixed(2)),
        taxAmount: Number(newTax.toFixed(2)),
        totalAmount: Number(newTotal.toFixed(2)),
        status: "pending",
        errorMessage: undefined,
      };

      // Save changes back to IndexedDB
      await putInStore("queue", updatedItem);
      await loadQueue();

      setResolutionOpen(false);
      toast.success("Transaction quantities reduced. Will retry syncing.");
      
      // Trigger sync
      SyncEngine.processQueue();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bg: string }> = {
      pending: { label: "Pending Sync", bg: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
      syncing: { label: "Syncing", bg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
      synced: { label: "Synced", bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
      failed: { label: "Sync Failed (Retry scheduled)", bg: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
      conflict: { label: "Sync Conflict", bg: "bg-rose-600/10 text-rose-600 border-rose-600/30" },
    };

    const c = config[status] || { label: status, bg: "bg-muted text-muted-foreground" };
    return <Badge className={`border uppercase text-[10px] font-extrabold ${c.bg}`}>{c.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 space-y-6 lg:p-6">
      <div className="flex items-center gap-3">
        <Link href="/pos">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Offline Queue</h1>
          <p className="text-sm text-muted-foreground">
            Manage transactions checked out offline and monitor sync statuses.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Unsynced Transactions</CardTitle>
            <CloudLightning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black">{items.length}</div>
            <p className="text-xs text-muted-foreground">Sales queued in IndexedDB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Sync Engine Status</CardTitle>
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            ) : isOnline ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-rose-500" />
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black capitalize">
              {isSyncing ? "Syncing..." : isOnline ? "Connected (Live)" : "Disconnected"}
            </div>
            <p className="text-xs text-muted-foreground">Network checking active</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-3">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Last successful sync:{" "}
              <span className="font-semibold text-foreground">{lastSyncLabel}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                className="gap-2 font-bold"
                onClick={handleSyncAll}
                disabled={isSyncing || !isOnline}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync now
              </Button>
              <Button
                variant="outline"
                className="gap-2 font-bold"
                onClick={handleSyncCatalog}
                disabled={isSyncing || !isOnline}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh catalog
              </Button>
              <Button
                variant="outline"
                className="gap-2 font-bold"
                onClick={handleExportBackup}
              >
                <Download className="h-4 w-4" />
                Export backup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-muted bg-card">
        <CardHeader>
          <CardTitle>Queued Checkout Operations</CardTitle>
          <CardDescription>
            Transactions processed while connection is unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-extrabold w-[110px]">Sale ID</TableHead>
                <TableHead className="font-extrabold">Time Created</TableHead>
                <TableHead className="font-extrabold text-right">Amount</TableHead>
                <TableHead className="font-extrabold">Payment</TableHead>
                <TableHead className="font-extrabold">Items</TableHead>
                <TableHead className="font-extrabold">Sync State</TableHead>
                <TableHead className="font-extrabold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground text-sm">
                    No transactions currently in queue. All sales are synced successfully.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/30">
                    <TableCell className="font-mono text-xs max-w-[110px] truncate">{item.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-bold text-right">{formatCurrency(item.totalAmount)}</TableCell>
                    <TableCell className="capitalize text-xs">
                      {item.payments.map((p) => p.payment_method.replace("_", " ")).join(", ")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.items.reduce((sum, i) => sum + i.quantity, 0)} items ({item.items.length} unique)
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(item.status)}
                        {item.errorMessage && (
                          <span className="text-[10px] text-destructive leading-tight max-w-[200px] truncate">
                            {item.errorMessage}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {item.status === "conflict" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 text-xs font-bold"
                            onClick={(e) => handleResolveConflictClick(item, e)}
                            disabled={!isOnline}
                          >
                            Resolve
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(item.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Conflict Resolution Dialog */}
      <Dialog open={resolutionOpen} onOpenChange={setResolutionOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <AlertCircle className="h-5 w-5 text-rose-500 animate-pulse" />
              Resolve Sync Conflict
            </DialogTitle>
            <DialogDescription className="text-xs">
              This sale failed validation because server inventory states mismatch the offline catalog.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 my-2">
              <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20 text-xs text-destructive">
                <p className="font-extrabold uppercase mb-1">Server Error:</p>
                <p className="leading-normal">{selectedItem.errorMessage}</p>
              </div>

              <div className="text-xs space-y-2 border-t pt-3">
                <p className="font-bold text-muted-foreground">Queued Sale Details:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-semibold">Receipt ID: </span>
                    <span className="font-mono">{selectedItem.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Total Amount: </span>
                    <span className="font-black">{formatCurrency(selectedItem.totalAmount)}</span>
                  </div>
                </div>
                <div className="bg-muted/50 p-2.5 rounded border text-xs max-h-[140px] overflow-y-auto">
                  <p className="font-extrabold mb-1">Cart Items:</p>
                  {selectedItem.items.map((i: any) => (
                    <div key={i.product_id} className="flex justify-between py-0.5 border-b border-muted last:border-b-0">
                      <span>{i.name} (x{i.quantity})</span>
                      <span className="font-bold">{formatCurrency(i.line_total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col sm:justify-start sm:space-x-0 mt-4">
            <Button
              className="w-full gap-2 font-bold"
              onClick={resolveConflictAutoReplenish}
              disabled={resolving || !isOnline}
            >
              {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Replenish Stock on Server & Retry
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 font-bold"
              onClick={resolveConflictReduceQuantity}
              disabled={resolving || !isOnline}
            >
              Reduce Quantity to Match Stock & Retry
            </Button>
            <Button
              variant="secondary"
              className="w-full gap-2 font-bold"
              onClick={() => setResolutionOpen(false)}
              disabled={resolving}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
