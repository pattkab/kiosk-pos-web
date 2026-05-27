"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";

interface TopProductsProps {
  products: any[];
  loading?: boolean;
}

export function TopProducts({ products, loading }: TopProductsProps) {
  if (loading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-4 w-12 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
        <CardDescription>
          Highest performing items by revenue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {products.map((product) => (
            <div key={product.name} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt={product.name} />
                <AvatarFallback>{product.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.sales} sales
                </p>
              </div>
              <div className="ml-auto font-medium">
                {formatCurrency(product.revenue)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
