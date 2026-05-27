"use client";

import { VirtualizedProductTable } from "@/features/inventory/components/virtualized-product-table";
import { ProductForm } from "@/features/inventory/components/product-form";
import { CategoryManager } from "@/features/inventory/components/category-manager";
import { InventoryAdjuster } from "@/features/inventory/components/inventory-adjuster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Tags,
  Camera,
  FileDown,
  FileUp,
  MoreHorizontal,
  RotateCcw,
  SlidersHorizontal
} from "lucide-react";
import { useInventoryStore } from "@/store/use-inventory-store";
import { useCategories } from "@/hooks/use-inventory";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dynamic from "next/dynamic";

// Performance: Lazy load scanner only when needed
const BarcodeScanner = dynamic(() => import("@/features/inventory/components/barcode-scanner").then(mod => mod.BarcodeScanner), {
  ssr: false
});

export default function InventoryPage() {
  const {
    setSearchQuery,
    searchQuery,
    openProductModal,
    openCategoryModal,
    setScannerOpen,
    stockFilter,
    setStockFilter,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter
  } = useInventoryStore();

  const { data: categories } = useCategories();

  const resetFilters = () => {
    setSearchQuery("");
    setStockFilter("all");
    setStatusFilter("all");
    setCategoryFilter(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground font-medium">Manage products, categories, and track stock movements.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={openCategoryModal} className="font-bold">
            <Tags className="mr-2 h-4 w-4" /> Categories
          </Button>
          <Button size="sm" onClick={() => openProductModal()} className="font-bold">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10 h-11 rounded-xl shadow-sm"
            placeholder="Search name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"
            onClick={() => setScannerOpen(true)}
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl font-bold">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filter
                {(stockFilter !== 'all' || statusFilter !== 'all' || categoryFilter) && (
                  <span className="ml-2 flex h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Stock Level</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={stockFilter === 'all'}
                onCheckedChange={() => setStockFilter('all')}
              >
                All Items
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={stockFilter === 'low'}
                onCheckedChange={() => setStockFilter('low')}
              >
                Low Stock
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={stockFilter === 'out'}
                onCheckedChange={() => setStockFilter('out')}
              >
                Out of Stock
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'all'}
                onCheckedChange={() => setStatusFilter('all')}
              >
                All Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'active'}
                onCheckedChange={() => setStatusFilter('active')}
              >
                Active Only
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'inactive'}
                onCheckedChange={() => setStatusFilter('inactive')}
              >
                Inactive Only
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Categories</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={categoryFilter === null}
                onCheckedChange={() => setCategoryFilter(null)}
              >
                All Categories
              </DropdownMenuCheckboxItem>
              {categories?.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat.id}
                  checked={categoryFilter === cat.id}
                  onCheckedChange={() => setCategoryFilter(cat.id)}
                >
                  {cat.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" onClick={resetFilters} className="font-bold h-11 px-4">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="font-bold">
                <FileDown className="mr-2 h-4 w-4" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem className="font-bold">
                <FileUp className="mr-2 h-4 w-4" /> Import CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Optimized Main Table */}
      <VirtualizedProductTable />

      {/* Modals & Overlays */}
      <ProductForm />
      <CategoryManager />
      <InventoryAdjuster />
      <BarcodeScanner />
    </div>
  );
}
