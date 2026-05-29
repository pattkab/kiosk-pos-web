"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import type { PosCatalogView } from "@/lib/pos/catalog-view";
import type { PosProduct } from "@/types/pos";
import { Loader2, Plus } from "lucide-react";

type PosProductCatalogProps = {
  products: PosProduct[];
  view: PosCatalogView;
  selectedIndex: number;
  isBarcodePending?: boolean;
  onAddProduct: (product: PosProduct) => void;
};

function ProductThumbnail({
  product,
  className,
  imageClassName,
  fallbackClassName,
}: {
  product: PosProduct;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}) {
  if (product.image_url) {
    return (
      <div className={cn("relative overflow-hidden bg-muted/50", className)}>
        <Image
          fill
          src={product.image_url}
          alt={product.name}
          className={cn("object-cover", imageClassName)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted/50 font-black uppercase text-muted-foreground/20",
        className,
        fallbackClassName,
      )}
    >
      {product.name.charAt(0)}
    </div>
  );
}

function StockBadges({
  product,
  className,
}: {
  product: PosProduct;
  className?: string;
}) {
  const stock = Number(product.stock_quantity ?? 0);
  const isOut = stock <= 0;
  const isLow =
    stock <= Number(product.low_stock_threshold ?? 0) && stock > 0;

  if (!isOut && !isLow) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {isLow ? (
        <Badge variant="destructive" className="text-[10px] uppercase">
          {stock} left
        </Badge>
      ) : null}
      {isOut ? (
        <Badge variant="destructive" className="uppercase">
          Sold out
        </Badge>
      ) : null}
    </div>
  );
}

function GridProductCard({
  product,
  index,
  selectedIndex,
  isBarcodePending,
  onAddProduct,
}: {
  product: PosProduct;
  index: number;
  selectedIndex: number;
  isBarcodePending?: boolean;
  onAddProduct: (product: PosProduct) => void;
}) {
  const stock = Number(product.stock_quantity ?? 0);
  const isSelected = index === selectedIndex;
  const isOut = stock <= 0;

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden rounded-lg border-2 bg-card transition-all active:scale-[0.98]",
        isSelected
          ? "border-primary shadow-lg shadow-primary/10"
          : "border-transparent hover:border-primary/40",
        isOut && "cursor-not-allowed opacity-55 grayscale",
      )}
      onClick={() => onAddProduct(product)}
    >
      <div className="relative aspect-[4/3] bg-muted/50">
        <ProductThumbnail
          product={product}
          className="absolute inset-0"
          fallbackClassName="text-6xl"
        />
        {stock <= Number(product.low_stock_threshold ?? 0) && stock > 0 ? (
          <Badge
            variant="destructive"
            className="absolute right-2 top-2 text-[10px] uppercase"
          >
            {stock} left
          </Badge>
        ) : null}
        {isOut ? (
          <Badge
            variant="destructive"
            className="absolute left-2 top-2 uppercase"
          >
            Sold out
          </Badge>
        ) : null}
        {isBarcodePending ? (
          <Loader2 className="absolute bottom-2 right-2 h-4 w-4 animate-spin text-primary" />
        ) : null}
      </div>
      <CardContent className="p-3">
        <div className="min-h-[44px]">
          <h4 className="line-clamp-2 text-sm font-bold leading-tight group-hover:text-primary">
            {product.name}
          </h4>
          <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.categories?.name ?? product.sku ?? "Uncategorized"}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-lg font-black">
            {formatCurrency(Number(product.selling_price ?? 0))}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ListProductRow({
  product,
  index,
  selectedIndex,
  onAddProduct,
}: {
  product: PosProduct;
  index: number;
  selectedIndex: number;
  onAddProduct: (product: PosProduct) => void;
}) {
  const stock = Number(product.stock_quantity ?? 0);
  const isSelected = index === selectedIndex;
  const isOut = stock <= 0;

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden rounded-lg border-2 bg-card transition-all active:scale-[0.99]",
        isSelected
          ? "border-primary shadow-md shadow-primary/10"
          : "border-transparent hover:border-primary/40",
        isOut && "cursor-not-allowed opacity-55 grayscale",
      )}
      onClick={() => onAddProduct(product)}
    >
      <CardContent className="flex items-center gap-3 p-3 sm:gap-4">
        <ProductThumbnail
          product={product}
          className="h-16 w-16 shrink-0 rounded-md"
          fallbackClassName="text-2xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-bold group-hover:text-primary sm:text-base">
                {product.name}
              </h4>
              <p className="mt-0.5 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {product.categories?.name ?? product.sku ?? "Uncategorized"}
                {product.sku && product.categories?.name
                  ? ` · ${product.sku}`
                  : ""}
              </p>
            </div>
            <span className="shrink-0 text-base font-black sm:text-lg">
              {formatCurrency(Number(product.selling_price ?? 0))}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <StockBadges product={product} />
            <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground sm:h-10 sm:w-10">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PosProductCatalogSkeleton({ view }: { view: PosCatalogView }) {
  if (view === "list") {
    return (
      <div className="space-y-2 pb-28 lg:pb-8">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="h-[88px] animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 15 }).map((_, index) => (
        <div
          key={index}
          className="aspect-[4/3] animate-pulse rounded-lg border bg-muted"
        />
      ))}
    </div>
  );
}

export function PosProductCatalog({
  products,
  view,
  selectedIndex,
  isBarcodePending,
  onAddProduct,
}: PosProductCatalogProps) {
  if (view === "list") {
    return (
      <div className="space-y-2 pb-28 lg:pb-8">
        {products.map((product, index) => (
          <ListProductRow
            key={product.id}
            product={product}
            index={index}
            selectedIndex={selectedIndex}
            onAddProduct={onAddProduct}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 pb-28 sm:grid-cols-3 lg:pb-8 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((product, index) => (
        <GridProductCard
          key={product.id}
          product={product}
          index={index}
          selectedIndex={selectedIndex}
          isBarcodePending={isBarcodePending}
          onAddProduct={onAddProduct}
        />
      ))}
    </div>
  );
}
