"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCategories } from "@/hooks/use-inventory";
import { useBarcodeLookup, usePosProducts, useRegisterSession } from "@/hooks/use-pos";
import { CartSidebar } from "@/features/pos/components/cart-sidebar";
import { useCartStore } from "@/store/use-cart-store";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { useProductSearchStore } from "@/store/use-product-search-store";
import { useScannerStore } from "@/store/use-scanner-store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Grid2X2, History, Loader2, PackageSearch, Plus, ScanBarcode, Search } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Performance: Lazy load the heavy barcode scanner only when needed
const BarcodeScanner = dynamic(() => import("@/features/pos/components/barcode-scanner").then(mod => mod.BarcodeScanner), {
  ssr: false
});

export default function PosPage() {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const barcodeBufferRef = useRef("");
  const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: categories } = useCategories();
  const { activeSession } = useRegisterSession();
  const {
    search,
    debouncedSearch,
    activeCategoryId,
    selectedIndex,
    recentProducts,
    setSearch,
    setDebouncedSearch,
    setActiveCategoryId,
    moveSelection,
    rememberProduct,
  } = useProductSearchStore();
  const { addItem, incrementItem, decrementItem, lastAddedProductId } = useCartStore();
  const { openPayment, isPaymentOpen } = useCheckoutStore();
  const { openScanner } = useScannerStore();
  const barcodeLookup = useBarcodeLookup();
  const productsQuery = usePosProducts({ search: debouncedSearch, categoryId: activeCategoryId, limit: 90 });
  const products = productsQuery.data ?? [];
  const selectedProduct = products[selectedIndex];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 120);
    return () => clearTimeout(timer);
  }, [search, setDebouncedSearch]);

  useEffect(() => {
    activeSession.refetch();
  }, []);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === "F2") {
        event.preventDefault();
        openPayment();
        return;
      }

      if (event.key === "Escape") {
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === "ArrowDown" && !isPaymentOpen) {
        event.preventDefault();
        moveSelection(1, products.length);
        return;
      }

      if (event.key === "ArrowUp" && !isPaymentOpen) {
        event.preventDefault();
        moveSelection(-1, products.length);
        return;
      }

      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        barcodeBufferRef.current += event.key;
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        barcodeTimerRef.current = setTimeout(() => {
          barcodeBufferRef.current = "";
        }, 70);
      }

      if (event.key === "Enter" && barcodeBufferRef.current.length >= 6) {
        const barcode = barcodeBufferRef.current;
        barcodeBufferRef.current = "";
        try {
          const product = await barcodeLookup.mutateAsync(barcode);
          addItem(product);
          rememberProduct(product);
          toast.success(`${product.name} added`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Barcode lookup failed.");
        }
        return;
      }

      if (event.key === "Enter" && selectedProduct && !isPaymentOpen) {
        event.preventDefault();
        if ((selectedProduct.stock_quantity ?? 0) <= 0) return;
        addItem(selectedProduct);
        rememberProduct(selectedProduct);
        return;
      }

      if ((event.key === "+" || event.key === "=") && lastAddedProductId && !isTyping) {
        event.preventDefault();
        incrementItem(lastAddedProductId);
        return;
      }

      if (event.key === "-" && lastAddedProductId && !isTyping) {
        event.preventDefault();
        decrementItem(lastAddedProductId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    addItem,
    barcodeLookup,
    decrementItem,
    incrementItem,
    isPaymentOpen,
    lastAddedProductId,
    moveSelection,
    openPayment,
    products,
    rememberProduct,
    selectedProduct,
  ]);

  const visibleRecentProducts = useMemo(
    () => recentProducts.filter((product) => !activeCategoryId || product.category_id === activeCategoryId).slice(0, 6),
    [activeCategoryId, recentProducts]
  );

  const addProduct = (product: typeof products[number]) => {
    if ((product.stock_quantity ?? 0) <= 0) return;
    addItem(product);
    rememberProduct(product);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 overflow-hidden lg:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                className="h-14 border-0 bg-muted/40 pl-12 text-lg focus-visible:ring-1"
                placeholder="Search products, SKU, or barcode"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoFocus
              />
            </div>
            <Button variant="secondary" className="h-14 gap-2 px-5 font-bold" onClick={openScanner}>
              <ScanBarcode className="h-5 w-5" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={activeCategoryId === null ? "default" : "secondary"}
              className="h-10 shrink-0 rounded-full px-5 font-bold"
              onClick={() => setActiveCategoryId(null)}
            >
              <Grid2X2 className="mr-2 h-4 w-4" />
              All
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={activeCategoryId === category.id ? "default" : "secondary"}
                className="h-10 shrink-0 rounded-full px-5 font-bold"
                onClick={() => setActiveCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {!search && visibleRecentProducts.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="flex shrink-0 items-center gap-1 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <History className="h-4 w-4" />
              Recent
            </span>
            {visibleRecentProducts.map((product) => (
              <Button key={product.id} variant="outline" className="h-10 shrink-0 rounded-full" onClick={() => addProduct(product)}>
                {product.name}
              </Button>
            ))}
          </div>
        )}

        <ScrollArea className="flex-1">
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 15 }).map((_, index) => (
                <div key={index} className="aspect-[4/3] animate-pulse rounded-lg border bg-muted" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <PackageSearch className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">No products found</h3>
              <p className="mt-1 max-w-sm text-muted-foreground">Try another search term, category, SKU, or barcode.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-8 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {products.map((product, index) => {
                const stock = Number(product.stock_quantity ?? 0);
                const isSelected = index === selectedIndex;
                const isOut = stock <= 0;

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      "group cursor-pointer overflow-hidden rounded-lg border-2 bg-card transition-all active:scale-[0.98]",
                      isSelected ? "border-primary shadow-lg shadow-primary/10" : "border-transparent hover:border-primary/40",
                      isOut && "cursor-not-allowed opacity-55 grayscale"
                    )}
                    onClick={() => addProduct(product)}
                  >
                    <div className="relative aspect-[4/3] bg-muted/50">
                      {product.image_url ? (
                        <Image fill src={product.image_url} alt={product.name} className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-6xl font-black uppercase text-muted-foreground/20">
                          {product.name.charAt(0)}
                        </div>
                      )}
                      {stock <= Number(product.low_stock_threshold ?? 0) && stock > 0 && (
                        <Badge variant="destructive" className="absolute right-2 top-2 text-[10px] uppercase">
                          {stock} left
                        </Badge>
                      )}
                      {isOut && <Badge variant="destructive" className="absolute left-2 top-2 uppercase">Sold out</Badge>}
                      {barcodeLookup.isPending && <Loader2 className="absolute bottom-2 right-2 h-4 w-4 animate-spin text-primary" />}
                    </div>
                    <CardContent className="p-3">
                      <div className="min-h-[44px]">
                        <h4 className="line-clamp-2 text-sm font-bold leading-tight group-hover:text-primary">{product.name}</h4>
                        <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {product.categories?.name ?? product.sku ?? "Uncategorized"}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-lg font-black">{formatCurrency(Number(product.selling_price ?? 0))}</span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                          <Plus className="h-5 w-5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="hidden w-[410px] shrink-0 lg:block xl:w-[440px]">
        <CartSidebar />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background p-2 lg:hidden">
        <CartSidebar />
      </div>
      <BarcodeScanner />
    </div>
  );
}
