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
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrganizationStore } from "@/store/use-organization-store";

export function ProductForm() {
  const { productModalOpen, closeProductModal, editingProductId } = useInventoryStore();
  const { data: categories } = useCategories();
  const { createProduct, updateProduct } = useProductMutations();
  const { data: products } = useProducts({});
  const activeCurrency = useOrganizationStore((state) => state.activeCurrency);

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
    },
  });

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
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{editingProductId ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="max-h-[70vh] p-6 pt-2">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Product Name</FormLabel>
                        <FormControl><Input placeholder="Organic Coffee" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl><Input placeholder="Optional product notes for staff" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
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
                   <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>POS visibility</FormLabel>
                          <FormDescription className="text-xs">Inactive products stay in inventory but cannot be sold.</FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex rounded-md border p-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={field.value ? "default" : "ghost"}
                              onClick={() => field.onChange(true)}
                            >
                              Active
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={!field.value ? "default" : "ghost"}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl><Input placeholder="COF-001" {...field} /></FormControl>
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
                        <FormControl><Input placeholder="Scan or enter barcode" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="cost_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost price</FormLabel>
                        <FormDescription className="text-xs">{activeCurrency}</FormDescription>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="selling_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling price</FormLabel>
                        <FormDescription className="text-xs">{activeCurrency}</FormDescription>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Stock</FormLabel>
                        <FormControl><Input type="number" {...field} disabled={!!editingProductId} /></FormControl>
                        <FormDescription className="text-xs">Use 'Adjustment' for existing products.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="low_stock_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Stock Alert</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-0">
              <Button variant="outline" type="button" onClick={closeProductModal}>Cancel</Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {editingProductId ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
