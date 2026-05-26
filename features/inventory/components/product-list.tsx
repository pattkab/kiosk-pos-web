"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductList() {
  const supabase = createClient();

  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data as Product[];
    },
  });

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error loading products: {(error as Error).message}</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products?.map((product) => (
        <Card key={product.id}>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{product.sku}</span>
              <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
            </div>
            <div className="mt-2 text-sm">
              Stock: <span className={product.stock_quantity < 10 ? "text-destructive font-bold" : ""}>{product.stock_quantity}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
