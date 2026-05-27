"use client";

import {
  useProducts,
  useProductMutations
} from "@/hooks/use-inventory";
import { useInventoryStore } from "@/store/use-inventory-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  History,
  ArrowUpRight,
  AlertTriangle,
  PackageSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export function ProductTable() {
  const {
    searchQuery,
    categoryFilter,
    statusFilter,
    stockFilter,
    openProductModal,
    openAdjustmentModal
  } = useInventoryStore();

  const { data: products, isLoading } = useProducts({
    search: searchQuery,
    category_id: categoryFilter,
    status: statusFilter,
    stock: stockFilter,
  });

  const { deleteProduct } = useProductMutations();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try adjusting your filters or add a new product to get started."
        icon={PackageSearch}
        action={{
          label: "Add Product",
          onClick: () => openProductModal(),
        }}
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>SKU/Barcode</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
                  {product.image_url ? (
                    <Image
                      fill
                      src={product.image_url}
                      alt={product.name}
                      className="object-cover"
                    />
                  ) : (
                    <PackageSearch className="m-auto h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <p>{product.name}</p>
                  {product.stock_quantity <= product.low_stock_threshold && (
                    <div className="flex items-center text-[10px] text-destructive font-bold">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      LOW STOCK
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {product.categories?.name || "Uncategorized"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs font-mono">
                <div>{product.sku || "-"}</div>
                <div>{product.barcode || "-"}</div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(Number(product.selling_price))}
              </TableCell>
              <TableCell className="text-right">
                <span className={product.stock_quantity === 0 ? "text-destructive font-bold" : ""}>
                  {product.stock_quantity}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={product.is_active ? "success" : "outline"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openProductModal(product.id)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdjustmentModal(product.id)}>
                      <ArrowUpRight className="mr-2 h-4 w-4" /> Adjust Stock
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <History className="mr-2 h-4 w-4" /> View History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure?")) deleteProduct.mutate(product.id);
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
