import { ProductList } from "@/features/inventory/components/product-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage your products and stock levels.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
      <ProductList />
    </div>
  );
}
