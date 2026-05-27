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
import { MoreHorizontal, AlertTriangle, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export function VirtualizedProductTable() {
  const { searchQuery, categoryFilter, stockFilter, statusFilter, openProductModal, openAdjustmentModal } = useInventoryStore();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteProducts({
    search: searchQuery,
    categoryId: categoryFilter,
    stock: stockFilter,
    status: statusFilter,
  });

  const flatData = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "image_url",
        header: "Image",
        cell: ({ row }) => (
          <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
            {row.original.image_url ? (
              <Image fill src={row.original.image_url} alt="" className="object-cover" />
            ) : (
              <PackageSearch className="m-auto h-5 w-5 text-muted-foreground/30" />
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
            <div className="text-[10px] text-muted-foreground font-mono">{row.original.sku || "NO-SKU"}</div>
          </div>
        ),
      },
      {
        accessorKey: "categories.name",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal uppercase text-[10px]">
            {row.original.categories?.name || "Uncategorized"}
          </Badge>
        ),
      },
      {
        accessorKey: "cost_price",
        header: () => <div className="text-right">Unit cost</div>,
        cell: ({ row }) => (
          <div className="text-right text-muted-foreground">{formatCurrency(row.original.cost_price)}</div>
        ),
      },
      {
        accessorKey: "selling_price",
        header: () => <div className="text-right">Unit sale price</div>,
        cell: ({ row }) => (
          <div className="text-right font-black text-primary">{formatCurrency(row.original.selling_price)}</div>
        ),
      },
      {
        accessorKey: "stock_quantity",
        header: () => <div className="text-right">Stock</div>,
        cell: ({ row }) => {
          const isLow = row.original.stock_quantity <= row.original.low_stock_threshold;
          return (
            <div className="text-right">
              <span className={isLow ? "text-destructive font-black" : "font-medium"}>
                {row.original.stock_quantity}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "expiry_date",
        header: "Expiry",
        cell: ({ row }) => {
          const date = row.original.expiry_date;
          if (!date) return <span className="text-muted-foreground">-</span>;
          const isExpired = new Date(date) < new Date();
          return (
            <Badge variant={isExpired ? "destructive" : "outline"} className="font-mono text-[10px]">
              {date}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => openAdjustmentModal(row.original.id)}>
              Adjust
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openProductModal(row.original.id)} aria-label={`Edit ${row.original.name}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [openAdjustmentModal, openProductModal]
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
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, virtualRows, rows.length]);

  if (isLoading) {
    return <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
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
      className="h-[600px] overflow-auto rounded-xl border bg-card shadow-sm"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-md">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualRows.map((virtualRow) => {
              const isLoaderRow = virtualRow.index > rows.length - 1;
              const row = rows[virtualRow.index];

              return (
                <tr
                  key={virtualRow.key}
                  className="absolute left-0 w-full border-b hover:bg-muted/30 transition-colors"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {isLoaderRow ? (
                    <td colSpan={columns.length} className="p-4 text-center text-xs text-muted-foreground animate-pulse">
                      Loading more products...
                    </td>
                  ) : (
                    row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
