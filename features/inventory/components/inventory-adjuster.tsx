"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adjustmentSchema,
  type AdjustmentFormValues,
} from "@/validators/inventory";
import {
  Form,
  FormControl,
  FormDescription,
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
  SelectValue,
} from "@/components/ui/select";
import { useInventoryStore } from "@/store/use-inventory-store";
import { useInventoryAdjustment, useProducts } from "@/hooks/use-inventory";
import { useEffect } from "react";
import {
  AlertTriangle,
  CalendarDays,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const movementOptions = [
  {
    value: "purchase",
    label: "Add stock",
    description: "New delivery or restock",
    icon: PackagePlus,
  },
  {
    value: "damage",
    label: "Remove stock",
    description: "Damage, loss, or expiry",
    icon: PackageMinus,
  },
  {
    value: "adjustment",
    label: "Correct count",
    description: "Stock take correction",
    icon: RotateCcw,
  },
] as const;

export function InventoryAdjuster() {
  const { adjustmentModalOpen, closeAdjustmentModal, adjustingProductId } =
    useInventoryStore();
  const { data: products } = useProducts({});
  const adjustStock = useInventoryAdjustment();

  const product = products?.find((p) => p.id === adjustingProductId);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      product_id: "",
      quantity_change: 0,
      transaction_type: "purchase",
      notes: "",
      adjustment_date: new Date().toISOString().split("T")[0],
      expiry_date: null,
    },
  });

  useEffect(() => {
    if (adjustingProductId) {
      form.reset({
        product_id: adjustingProductId,
        quantity_change: 0,
        transaction_type: "purchase",
        notes: "",
        adjustment_date: new Date().toISOString().split("T")[0],
        expiry_date: product?.expiry_date ?? null,
      });
    }
  }, [adjustingProductId, form, product?.expiry_date]);

  const transactionType = form.watch("transaction_type");
  const quantity = Number(form.watch("quantity_change") || 0);
  const currentStock = Number(product?.stock_quantity || 0);
  const normalizedQuantity =
    transactionType === "damage" || transactionType === "expiry"
      ? -Math.abs(quantity)
      : quantity;
  const projectedStock = Math.max(0, currentStock + normalizedQuantity);

  const onSubmit = async (values: AdjustmentFormValues) => {
    const quantity = Number(values.quantity_change);
    const normalizedValues = {
      ...values,
      quantity_change:
        values.transaction_type === "damage" ||
        values.transaction_type === "expiry"
          ? -Math.abs(quantity)
          : quantity,
      notes:
        values.notes ||
        (values.transaction_type === "purchase"
          ? "Restocked inventory"
          : values.transaction_type === "damage"
            ? "Removed damaged or unavailable stock"
            : "Corrected stock count"),
    };

    await adjustStock.mutateAsync(normalizedValues);
    closeAdjustmentModal();
  };

  return (
    <Dialog open={adjustmentModalOpen} onOpenChange={closeAdjustmentModal}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden">
        <DialogHeader>
          <div className="border-b px-6 py-5">
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <PackageCheck className="h-5 w-5 text-primary" />
              Stock movement
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {product?.name
                ? `Update quantity for ${product.name}.`
                : "Update product quantity."}
            </p>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-3 overflow-hidden rounded-md border text-sm">
                <div className="border-r bg-muted/30 p-3">
                  <div className="text-xs font-bold uppercase text-muted-foreground">
                    Current
                  </div>
                  <div className="mt-1 text-2xl font-black">{currentStock}</div>
                </div>
                <div className="border-r bg-muted/30 p-3">
                  <div className="text-xs font-bold uppercase text-muted-foreground">
                    Change
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-2xl font-black",
                      normalizedQuantity < 0
                        ? "text-destructive"
                        : "text-emerald-700",
                    )}
                  >
                    {normalizedQuantity > 0 ? "+" : ""}
                    {normalizedQuantity || 0}
                  </div>
                </div>
                <div className="bg-muted/30 p-3">
                  <div className="text-xs font-bold uppercase text-muted-foreground">
                    After
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {projectedStock}
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Movement type</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {movementOptions.map((option) => {
                          const Icon = option.icon;
                          const selected =
                            field.value === option.value ||
                            (option.value === "damage" &&
                              field.value === "expiry");
                          return (
                            <Button
                              key={option.value}
                              type="button"
                              variant={selected ? "default" : "outline"}
                              className="h-auto justify-start rounded-md p-3 text-left"
                              onClick={() => field.onChange(option.value)}
                            >
                              <Icon className="mr-2 h-4 w-4 shrink-0" />
                              <span className="min-w-0">
                                <span className="block font-bold">
                                  {option.label}
                                </span>
                                <span
                                  className={cn(
                                    "block text-xs",
                                    selected
                                      ? "text-primary-foreground/80"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {option.description}
                                </span>
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(transactionType === "damage" ||
                transactionType === "expiry") && (
                <FormField
                  control={form.control}
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">
                        Removal reason
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="damage">
                            Damaged, lost, or unusable
                          </SelectItem>
                          <SelectItem value="expiry">Expired stock</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="quantity_change"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {transactionType === "purchase" ||
                      transactionType === "return"
                        ? "Quantity received"
                        : transactionType === "adjustment"
                          ? "Quantity correction"
                          : "Quantity to remove"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="h-12 text-lg font-bold"
                        placeholder={
                          transactionType === "adjustment"
                            ? "Use + or - e.g. -2"
                            : "e.g. 12"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {transactionType === "adjustment"
                        ? "Use a positive number to increase stock or a negative number to reduce it."
                        : "Enter the quantity only. The app applies the direction for this movement."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="adjustment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-bold">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        Stocking date
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-11"
                          type="date"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-bold">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Expiry date
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-11"
                          type="date"
                          {...field}
                          value={field.value ?? ""}
                          disabled={
                            transactionType === "damage" ||
                            transactionType === "expiry"
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Optional. Updates the product expiry alert date.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Notes</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11"
                        placeholder="Supplier, invoice, reason, or stock count note"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="border-t bg-muted/10 px-6 py-4">
              <Button
                variant="outline"
                type="button"
                className="h-11 rounded-md font-bold"
                onClick={closeAdjustmentModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-md font-black"
                disabled={adjustStock.isPending}
              >
                Save stock movement
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
