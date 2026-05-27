"use client";

import React, { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { useInfiniteProducts } from "@/hooks/use-inventory-optimized";
import { useInventoryStore } from "@/store/use-inventory-store";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  MoreHorizontal,
  PackagePlus,
  PackageSearch,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const inventoryColumns =
  "64px minmax(220px,1.5fr) minmax(130px,0.8fr) minmax(120px,0.8fr) minmax(140px,0.9fr) minmax(130px,0.7fr) minmax(140px,0.8fr) 132px";
const rightAlignedColumns = new Set([
  "cost_price",
  "selling_price",
  "stock_quantity",
  "actions",
]);

function getExpiryState(expiryDate?: string | null) {
  if (!expiryDate) return { label: "-", tone: "muted" as const };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiresAt = new Date(`${expiryDate}T00:00:00`);
  const days = Math.ceil((expiresAt.getTime() - today.getTime()) / 86_400_000);

  if (days < 0)
    return { label: "Expired", detail: expiryDate, tone: "danger" as const };
  if (days <= 30)
    return {
      label: `${days}d left`,
      detail: expiryDate,
      tone: "warning" as const,
    };
  return { label: expiryDate, tone: "neutral" as const };
}

export function VirtualizedProductTable() {
  const {
    searchQuery,
    categoryFilter,
    stockFilter,
    statusFilter,
    openProductModal,
    openAdjustmentModal,
  } = useInventoryStore();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteProducts({
      search: searchQuery,
      categoryId: categoryFilter,
      stock: stockFilter,
      status: statusFilter,
    });

  const flatData = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "image_url",
        header: "Image",
        cell: ({ row }) => (
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {row.original.image_url ? (
              <Image
                fill
                src={row.original.image_url}
                alt=""
                className="object-cover"
              />
            ) : (
              <PackageSearch className="h-5 w-5 text-muted-foreground/30" />
            )}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => (
          <div>
            <div className="font-bold">{row.original.name}</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {row.original.sku || "NO-SKU"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "categories.name",
        header: "Category",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="max-w-full truncate font-normal uppercase text-[10px]"
          >
            {row.original.categories?.name || "Uncategorized"}
          </Badge>
        ),
      },
      {
        accessorKey: "cost_price",
        header: () => <div className="text-right">Unit cost</div>,
        cell: ({ row }) => (
          <div className="text-right text-muted-foreground">
            {formatCurrency(row.original.cost_price)}
          </div>
        ),
      },
      {
        accessorKey: "selling_price",
        header: () => <div className="text-right">Unit sale price</div>,
        cell: ({ row }) => (
          <div className="text-right font-black text-primary">
            {formatCurrency(row.original.selling_price)}
          </div>
        ),
      },
      {
        accessorKey: "stock_quantity",
        header: () => <div className="text-right">Stock</div>,
        cell: ({ row }) => {
          const isLow =
            row.original.stock_quantity <= row.original.low_stock_threshold;
          const isOut = row.original.stock_quantity === 0;
          return (
            <div className="flex items-center justify-end gap-2">
              {isLow && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              )}
              <span
                className={
                  isOut
                    ? "font-black text-destructive"
                    : isLow
                      ? "font-black text-amber-700"
                      : "font-semibold"
                }
              >
                {row.original.stock_quantity}
              </span>
              <span className="text-xs text-muted-foreground">
                / {row.original.low_stock_threshold}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "expiry_date",
        header: "Expiry",
        cell: ({ row }) => {
          const expiry = getExpiryState(row.original.expiry_date);
          if (expiry.tone === "muted")
            return <span className="text-muted-foreground">-</span>;
          return (
            <Badge
              variant={expiry.tone === "danger" ? "destructive" : "outline"}
              className={
                expiry.tone === "warning"
                  ? "border-amber-200 bg-amber-50 font-mono text-[10px] text-amber-800"
                  : "font-mono text-[10px]"
              }
            >
              {expiry.tone === "warning" && (
                <CalendarClock className="mr-1 h-3 w-3" />
              )}
              {expiry.label}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 font-bold"
              onClick={() => openAdjustmentModal(row.original.id)}
            >
              <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
              Stock
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`More actions for ${row.original.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => openProductModal(row.original.id)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [openAdjustmentModal, openProductModal],
  );

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();

  React.useEffect(() => {
    const [lastItem] = [...virtualRows].reverse();
    if (!lastItem) return;

    if (
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    virtualRows,
    rows.length,
  ]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (flatData.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
        <PackageSearch className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-lg font-bold">No products match this view</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Try clearing filters, scanning another code, or adding a new product.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto rounded-md border bg-card shadow-sm"
    >
      <div
        className="sticky top-0 z-10 grid min-w-[1120px] border-b bg-muted/70 px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground backdrop-blur-md"
        style={{ gridTemplateColumns: inventoryColumns }}
      >
        {table.getHeaderGroups()[0]?.headers.map((header) => (
          <div
            key={header.id}
            className={`flex items-center px-2 ${rightAlignedColumns.has(header.column.id) ? "justify-end" : ""}`}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </div>
        ))}
      </div>
      <div
        className="min-w-[1120px]"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualRows.map((virtualRow) => {
          const isLoaderRow = virtualRow.index > rows.length - 1;
          const row = rows[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 grid w-full items-center border-b px-4 transition-colors hover:bg-muted/30"
              style={{
                gridTemplateColumns: inventoryColumns,
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div className="col-span-full animate-pulse p-4 text-center text-xs text-muted-foreground">
                  Loading more products...
                </div>
              ) : (
                row.getVisibleCells().map((cell) => (
                  <div key={cell.id} className="min-w-0 px-2 py-2 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
      <div className="sticky bottom-0 flex min-w-[1120px] items-center justify-between border-t bg-background/95 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
        <span className="flex items-center gap-1.5">
          <Boxes className="h-3.5 w-3.5" />
          {flatData.length} products loaded
        </span>
        <span>Stock column shows on-hand / low-stock alert point.</span>
      </div>
    </div>
  );
}
