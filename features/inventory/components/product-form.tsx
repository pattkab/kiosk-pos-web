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
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useInventoryStore } from "@/store/use-inventory-store";
import { useCategories, useProductMutations, useProducts } from "@/hooks/use-inventory";
import { ImageUpload } from "./image-upload";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrganizationStore } from "@/store/use-organization-store";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { Plus, X } from "lucide-react";

export function ProductForm() {
  const { productModalOpen, closeProductModal, editingProductId } = useInventoryStore();
  const { data: categories } = useCategories();
  const { createProduct, updateProduct } = useProductMutations();
  const { data: products } = useProducts({});
  const activeCurrency = useOrganizationStore((state) => state.activeCurrency);
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);
  const queryClient = useQueryClient();

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsAddingCategoryLoading] = useState(false);

  const editingProduct = products?.find(p => p.id === editingProductId);

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
      addition_date: new Date().toISOString().split('T')[0],
    },
  });

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim() || !activeOrganizationId) return;
    setIsAddingCategoryLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: newCategoryName, organization_id: activeOrganizationId })
        .select()
        .single();
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      form.setValue('category_id', data.id);
      setIsAddingCategory(false);
      setNewCategoryName("");
      toast.success("Category created");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAddingCategoryLoading(false);
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
        addition_date: editingProduct.created_at?.split('T')[0],
      });
    } else {
      form.reset();
    }
  }, [editingProduct, form]);

  const onSubmit = async (values: ProductFormValues) => {
    if (editingProductId) {
      await updateProduct.mutateAsync({ id: editingProductId, values });
    } else {
      await createProduct.mutateAsync(values);
    }
    closeProductModal();
  };

  return (
    <Dialog open={productModalOpen} onOpenChange={closeProductModal}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-black">{editingProductId ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-6 pt-2">
              <div className="space-y-8 pb-4">
                {/* 1. Basic Info & Image */}
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Photo</FormLabel>
                        <FormControl>
                          <ImageUpload value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Product Name *</FormLabel>
                          <FormControl><Input placeholder="e.g. Sweet Bread" className="h-11" {...field} /></FormControl>
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
                          <FormControl><Input placeholder="Optional notes (e.g. baked fresh daily)" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* 2. Categorization & Codes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <FormLabel className="font-bold">Category</FormLabel>
                    {!isAddingCategory ? (
                      <div className="flex gap-2">
                        <FormField
                          control={form.control}
                          name="category_id"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories?.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" variant="outline" className="h-11 px-3" onClick={() => setIsAddingCategory(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <Input
                          placeholder="New category name"
                          className="h-11"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          autoFocus
                        />
                        <Button type="button" className="h-11" onClick={handleQuickAddCategory} disabled={isSavingCategory}>Add</Button>
                        <Button type="button" variant="ghost" className="h-11 px-3" onClick={() => setIsAddingCategory(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl><Input placeholder="COF-001" className="h-11" {...field} /></FormControl>
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
                          <FormControl><Input placeholder="Scan or type" className="h-11" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* 3. Pricing & Margins */}
                <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Pricing ({activeCurrency})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Unit cost price</FormLabel>
                          <FormDescription className="text-[10px]">What you paid for 1 unit</FormDescription>
                          <FormControl><Input type="number" step="0.01" className="h-11 text-lg font-medium" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="selling_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Unit sale price</FormLabel>
                          <FormDescription className="text-[10px]">Price customer will pay</FormDescription>
                          <FormControl><Input type="number" step="0.01" className="h-11 text-lg font-black text-primary" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* 4. Inventory & Alerts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                   <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Initial Stock</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stock_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Qty on hand</FormLabel>
                            <FormControl><Input type="number" className="h-11" {...field} disabled={!!editingProductId} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="addition_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">As of date</FormLabel>
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
                    </div>
                   </div>

                   <div className="space-y-4 border-l md:pl-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground text-destructive">Health & Alerts</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="low_stock_threshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-destructive">Low Stock Alert</FormLabel>
                            <FormControl><Input type="number" className="h-11 border-destructive/20 focus-visible:ring-destructive" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="expiry_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-destructive">Expiry date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-11 border-destructive/20 focus-visible:ring-destructive"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                   </div>
                </div>

                <Separator />

                {/* 5. Visibility */}
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-2xl bg-muted/20 p-4 border border-dashed">
                      <div className="space-y-0.5">
                        <FormLabel className="font-bold">POS Visibility</FormLabel>
                        <FormDescription className="text-xs">Should this item be available for sale immediately?</FormDescription>
                      </div>
                      <FormControl>
                        <div className="flex rounded-xl border bg-background p-1 shadow-sm">
                          <Button
                            type="button"
                            size="sm"
                            variant={field.value ? "default" : "ghost"}
                            className={cn("rounded-lg font-bold", field.value && "shadow-md")}
                            onClick={() => field.onChange(true)}
                          >
                            Active
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!field.value ? "default" : "ghost"}
                            className={cn("rounded-lg font-bold", !field.value && "shadow-md")}
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
              <Button variant="outline" type="button" size="lg" className="rounded-xl h-12 px-8 font-bold" onClick={closeProductModal}>Cancel</Button>
              <Button type="submit" size="lg" className="rounded-xl h-12 px-8 font-black shadow-xl shadow-primary/20" disabled={createProduct.isPending || updateProduct.isPending}>
                {editingProductId ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
