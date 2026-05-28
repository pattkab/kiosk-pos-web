"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormValues } from "@/validators/inventory";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventoryStore } from "@/store/use-inventory-store";
import {
  useCategories,
  useProductMutations,
  useProducts,
} from "@/hooks/use-inventory";
import { ImageUpload } from "./image-upload";
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrganizationStore } from "@/store/use-organization-store";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarDays,
  Package,
  Plus,
  ScanBarcode,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useActiveOrganization,
  useOrganizationSettings,
} from "@/hooks/use-organization";
import {
  getCategorySeedsForBusinessType,
  getSeedCategoryKey,
} from "@/lib/category-taxonomy";
import dynamic from "next/dynamic";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import { canUseFeature } from "@/lib/billing/plans";

const InventoryBarcodeScanner = dynamic(
  () =>
    import("@/features/inventory/components/barcode-scanner").then(
      (mod) => mod.BarcodeScanner,
    ),
  {
    ssr: false,
  },
);

export function ProductForm() {
  const {
    productModalOpen,
    closeProductModal,
    editingProductId,
    scannerOpen,
    openScanner,
    scannedBarcode,
    clearScannedBarcode,
  } = useInventoryStore();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { activeOrganization } = useActiveOrganization();
  const organizationSettings = useOrganizationSettings();
  const { createProduct, updateProduct } = useProductMutations();
  const { data: products } = useProducts({});
  const activeCurrency = useOrganizationStore((state) => state.activeCurrency);
  const activeOrganizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );
  const queryClient = useQueryClient();

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsAddingCategoryLoading] = useState(false);
  const [isCreatingRecommendedCategory, setIsCreatingRecommendedCategory] =
    useState(false);

  const editingProduct = products?.find((p) => p.id === editingProductId);
  const canUseBarcode = canUseFeature(
    organizationSettings.data,
    "barcodeScanning",
  );
  const canUseExpiryTracking = canUseFeature(
    organizationSettings.data,
    "pharmacyExpiryTracking",
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      barcode: "",
      sku: "",
      category_id: null,
      cost_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      low_stock_threshold: 5,
      is_active: true,
      image_url: null,
      expiry_date: null,
      addition_date: new Date().toISOString().split("T")[0],
    },
  });

  const costPrice = Number(form.watch("cost_price") || 0);
  const sellingPrice = Number(form.watch("selling_price") || 0);
  const stockQuantity = Number(form.watch("stock_quantity") || 0);
  const margin = sellingPrice - costPrice;
  const marginPercent = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
  const stockCostValue = stockQuantity * costPrice;
  const stockSaleValue = stockQuantity * sellingPrice;
  const hasCategories = (categories?.length ?? 0) > 0;
  const recommendedCategories = getCategorySeedsForBusinessType(
    activeOrganization?.business_type,
  );
  const existingCategoryNames = new Set(
    (categories ?? []).map((category) => category.name.toLowerCase()),
  );
  const missingRecommendedCategories = recommendedCategories.filter(
    (category) => !existingCategoryNames.has(category.name.toLowerCase()),
  );
  const hasCategoryOptions =
    hasCategories || missingRecommendedCategories.length > 0;
  const categoriesByDepartment = useMemo(() => {
    return (categories ?? []).reduce<Record<string, typeof categories>>(
      (groups, category) => {
        const department = category.description?.trim() || "Custom categories";
        groups[department] = [...(groups[department] ?? []), category];
        return groups;
      },
      {},
    );
  }, [categories]);
  const formattedMoney = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: activeCurrency || "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const handleQuickAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (!activeOrganizationId) {
      toast.error("Select an organization before adding categories.");
      return;
    }
    setIsAddingCategoryLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name, organization_id: activeOrganizationId })
        .select()
        .single();
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      form.setValue("category_id", data.id);
      setIsAddingCategory(false);
      setNewCategoryName("");
      toast.success("Category created");
    } catch (err: any) {
      toast.error(
        getUserErrorMessage(
          err,
          "We could not create that category right now.",
        ),
      );
    } finally {
      setIsAddingCategoryLoading(false);
    }
  };

  const createCategoryFromRecommendation = async (categoryKey: string) => {
    if (!activeOrganizationId) {
      toast.error("Select an organization before adding categories.");
      return;
    }

    const recommendation = recommendedCategories.find(
      (category) => getSeedCategoryKey(category) === categoryKey,
    );
    if (!recommendation) return;

    const existingCategory = categories?.find(
      (category) =>
        category.name.toLowerCase() === recommendation.name.toLowerCase(),
    );
    if (existingCategory) {
      form.setValue("category_id", existingCategory.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    setIsCreatingRecommendedCategory(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: recommendation.name,
          description: recommendation.department,
          organization_id: activeOrganizationId,
        })
        .select()
        .single();
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      form.setValue("category_id", data.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success(`${recommendation.name} category added`);
    } catch (error: any) {
      toast.error(
        getUserErrorMessage(
          error,
          "We could not add that recommended category right now.",
        ),
      );
    } finally {
      setIsCreatingRecommendedCategory(false);
    }
  };

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        description: editingProduct.description || "",
        barcode: editingProduct.barcode || "",
        sku: editingProduct.sku || "",
        category_id: editingProduct.category_id,
        cost_price: Number(editingProduct.cost_price),
        selling_price: Number(editingProduct.selling_price),
        stock_quantity: editingProduct.stock_quantity,
        low_stock_threshold: editingProduct.low_stock_threshold,
        is_active: editingProduct.is_active,
        image_url: editingProduct.image_url,
        expiry_date: editingProduct.expiry_date,
        addition_date: editingProduct.created_at?.split("T")[0],
      });
    } else {
      form.reset();
    }
  }, [editingProduct, form]);

  useEffect(() => {
    if (!productModalOpen || !scannedBarcode) return;
    form.setValue("barcode", scannedBarcode, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearScannedBarcode();
    toast.success("Barcode captured");
  }, [clearScannedBarcode, form, productModalOpen, scannedBarcode]);

  const onSubmit = async (values: ProductFormValues) => {
    if (editingProductId) {
      await updateProduct.mutateAsync({ id: editingProductId, values });
    } else {
      await createProduct.mutateAsync(values);
    }
    closeProductModal();
  };

  return (
    <>
      <Dialog open={productModalOpen} onOpenChange={closeProductModal}>
        <DialogContent className="sm:max-w-[860px] p-0 overflow-hidden flex flex-col max-h-[92vh]">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle className="text-2xl font-black">
              {editingProductId
                ? "Edit product"
                : "Add product & opening stock"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <ScrollArea className="flex-1">
                <div className="space-y-6 p-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                      Product details
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Name the item, group it for reports, and capture scan
                      codes used at checkout.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_1fr]">
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product photo</FormLabel>
                          <FormControl>
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="font-bold">
                              Product Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Sweet Bread"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cost_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">
                              Unit cost price *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                                  {activeCurrency}
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="h-11 pl-12 text-lg font-medium"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">
                              What you paid for 1 unit
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="selling_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">
                              Unit sale price *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                                  {activeCurrency}
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="h-11 pl-12 text-lg font-black text-primary"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">
                              Price customer will pay
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs font-bold uppercase text-muted-foreground">
                        Margin
                      </div>
                      <div
                        className={cn(
                          "mt-1 font-black",
                          margin >= 0 ? "text-emerald-600" : "text-destructive",
                        )}
                      >
                        {sellingPrice > 0
                          ? `${marginPercent.toFixed(1)}% (${formattedMoney(margin)})`
                          : "0.0%"}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs font-bold uppercase text-muted-foreground">
                        Total Cost Value
                      </div>
                      <div className="mt-1 font-black text-muted-foreground">
                        {formattedMoney(stockCostValue)}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs font-bold uppercase text-muted-foreground">
                        Total Sale Value
                      </div>
                      <div className="mt-1 font-black text-primary">
                        {formattedMoney(stockSaleValue)}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between gap-3">
                            <FormLabel className="font-bold">
                              Category
                            </FormLabel>
                            {!isAddingCategory && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setIsAddingCategory(true)}
                              >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                {hasCategories ? "New" : "Create first"}
                              </Button>
                            )}
                          </div>
                          {!isAddingCategory ? (
                            <>
                              <Select
                                onValueChange={async (value) => {
                                  if (value.startsWith("recommended:")) {
                                    await createCategoryFromRecommendation(
                                      value.replace("recommended:", ""),
                                    );
                                    return;
                                  }
                                  field.onChange(value);
                                }}
                                value={field.value || undefined}
                                disabled={
                                  !hasCategoryOptions ||
                                  isCreatingRecommendedCategory
                                }
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue
                                      placeholder={
                                        isCreatingRecommendedCategory
                                          ? "Creating category..."
                                          : categoriesLoading
                                            ? "Loading categories..."
                                            : hasCategoryOptions
                                              ? "Select category"
                                              : "No categories yet"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(categoriesByDepartment).map(
                                    ([department, items]) => (
                                      <SelectGroup key={department}>
                                        <SelectLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                          {department}
                                        </SelectLabel>
                                        {items?.map((cat) => (
                                          <SelectItem
                                            key={cat.id}
                                            value={cat.id}
                                          >
                                            {cat.name}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    ),
                                  )}
                                  {missingRecommendedCategories.length > 0 && (
                                    <SelectGroup>
                                      <SelectLabel className="text-xs font-black uppercase tracking-widest text-primary">
                                        Recommended for this business
                                      </SelectLabel>
                                      {missingRecommendedCategories.map(
                                        (category) => (
                                          <SelectItem
                                            key={getSeedCategoryKey(category)}
                                            value={`recommended:${getSeedCategoryKey(category)}`}
                                          >
                                            <span className="flex flex-col">
                                              <span>{category.name}</span>
                                              <span className="text-xs text-muted-foreground">
                                                {category.department}
                                              </span>
                                            </span>
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectGroup>
                                  )}
                                </SelectContent>
                              </Select>
                              {!hasCategories && !categoriesLoading && (
                                <FormDescription className="text-xs">
                                  Recommended categories are ready to pick, or
                                  create your own missing category.
                                </FormDescription>
                              )}
                            </>
                          ) : (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                              <Input
                                placeholder="e.g. Beverages"
                                className="h-11"
                                value={newCategoryName}
                                onChange={(e) =>
                                  setNewCategoryName(e.target.value)
                                }
                                autoFocus
                              />
                              <Button
                                type="button"
                                className="h-11 px-4"
                                onClick={handleQuickAddCategory}
                                disabled={isSavingCategory}
                              >
                                Add
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-11 px-3"
                                onClick={() => setIsAddingCategory(false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="COF-001"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barcode</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                placeholder={
                                  canUseBarcode
                                    ? "Scan or type"
                                    : "Upgrade to Growth"
                                }
                                className="h-11"
                                disabled={!canUseBarcode}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="h-11 px-3"
                                onClick={() =>
                                  openScanner("product-form-barcode")
                                }
                                disabled={!canUseBarcode}
                                aria-label="Scan product barcode"
                              >
                                <ScanBarcode className="h-4 w-4" />
                              </Button>
                            </div>
                          </FormControl>
                          {!canUseBarcode ? (
                            <FormDescription className="text-xs">
                              Upgrade to Growth for barcode scanning.
                            </FormDescription>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Optional notes"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                      Stock setup & alerts
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Set the opening count, stocking date, reorder alert point,
                      and expiry tracking.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            Opening stock
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              className="h-11"
                              {...field}
                              disabled={!!editingProductId}
                            />
                          </FormControl>
                          {editingProductId && (
                            <FormDescription className="text-xs">
                              Use Stock from the table to add or remove
                              quantity.
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="addition_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            Stocking date
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-11"
                              {...field}
                              value={field.value ?? ""}
                              disabled={!!editingProductId}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="low_stock_threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            Low stock alert
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              className="h-11"
                              {...field}
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
                          <FormLabel className="font-bold">
                            Expiry date
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-11"
                              {...field}
                              value={field.value ?? ""}
                              disabled={!canUseExpiryTracking}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {canUseExpiryTracking
                              ? "Leave blank when not applicable."
                              : "Upgrade to Business for pharmacy expiry tracking."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-4 rounded-md border border-dashed bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="font-bold">
                            POS Visibility
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Available items appear at checkout.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex rounded-md border bg-background p-1 shadow-sm">
                            <Button
                              type="button"
                              size="sm"
                              variant={field.value ? "default" : "ghost"}
                              className={cn(
                                "rounded-md font-bold",
                                field.value && "shadow-md",
                              )}
                              onClick={() => field.onChange(true)}
                            >
                              Active
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={!field.value ? "default" : "ghost"}
                              className={cn(
                                "rounded-md font-bold",
                                !field.value && "shadow-md",
                              )}
                              onClick={() => field.onChange(false)}
                            >
                              Hidden
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>

              <DialogFooter className="p-6 border-t bg-muted/10">
                <Button
                  variant="outline"
                  type="button"
                  size="lg"
                  className="rounded-xl h-12 px-8 font-bold"
                  onClick={closeProductModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-xl h-12 px-8 font-black shadow-xl shadow-primary/20"
                  disabled={
                    createProduct.isPending ||
                    updateProduct.isPending ||
                    isCreatingRecommendedCategory
                  }
                >
                  {editingProductId
                    ? "Update product"
                    : "Create product & stock"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {scannerOpen ? <InventoryBarcodeScanner /> : null}
    </>
  );
}
