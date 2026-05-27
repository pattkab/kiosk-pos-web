"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adjustmentSchema, type AdjustmentFormValues } from "@/validators/inventory";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useInventoryStore } from "@/store/use-inventory-store";
import { useInventoryAdjustment, useProducts } from "@/hooks/use-inventory";
import { useEffect } from "react";

export function InventoryAdjuster() {
  const { adjustmentModalOpen, closeAdjustmentModal, adjustingProductId } = useInventoryStore();
  const { data: products } = useProducts({});
  const adjustStock = useInventoryAdjustment();

  const product = products?.find(p => p.id === adjustingProductId);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      product_id: "",
      quantity_change: 0,
      transaction_type: "adjustment",
      notes: "",
    },
  });

  useEffect(() => {
    if (adjustingProductId) {
      form.reset({
        product_id: adjustingProductId,
        quantity_change: 0,
        transaction_type: "adjustment",
        notes: "",
      });
    }
  }, [adjustingProductId, form]);

  const onSubmit = async (values: AdjustmentFormValues) => {
    await adjustStock.mutateAsync(values);
    closeAdjustmentModal();
  };

  return (
    <Dialog open={adjustmentModalOpen} onOpenChange={closeAdjustmentModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock: {product?.name}</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-muted-foreground">
          Current Stock: <span className="font-bold text-foreground">{product?.stock_quantity}</span>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity_change"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Change</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 10 for increase, -5 for decrease"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transaction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                      <SelectItem value="purchase">Restock (Purchase)</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="expiry">Expired</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Reason for adjustment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={closeAdjustmentModal}>Cancel</Button>
              <Button type="submit" disabled={adjustStock.isPending}>
                Update Inventory
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
