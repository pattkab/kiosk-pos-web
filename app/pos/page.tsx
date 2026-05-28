"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCategories } from "@/hooks/use-inventory";
import {
  useBarcodeLookup,
  usePosProducts,
  useRegisterSession,
} from "@/hooks/use-pos";
import { CartSidebar } from "@/features/pos/components/cart-sidebar";
import { useCartStore } from "@/store/use-cart-store";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { useProductSearchStore } from "@/store/use-product-search-store";
import { useScannerStore } from "@/store/use-scanner-store";
import { useInventoryStore } from "@/store/use-inventory-store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Grid2X2,
  History,
  Loader2,
  PackageSearch,
  Plus,
  ScanBarcode,
  Search,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { ProductForm } from "@/features/inventory/components/product-form";
import { isLikelyScannerBurst, normalizeScannedCode } from "@/lib/barcode";
import { getUserErrorMessage } from "@/lib/errors/user-message";

// Performance: Lazy load the heavy barcode scanner only when needed
const BarcodeScanner = dynamic(
  () =>
    import("@/features/pos/components/barcode-scanner").then(
      (mod) => mod.BarcodeScanner,
    ),
  {
    ssr: false,
  },
);

export default function PosPage() {
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const barcodeBufferRef = useRef("");
  const barcodeFirstKeyAtRef = useRef(0);
  const barcodeLastKeyAtRef = useRef(0);
  const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanQueueRef = useRef(Promise.resolve());
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
  const {
    addItem,
    incrementItem,
    decrementItem,
    lastAddedProductId,
    getTotals,
  } = useCartStore();
  const { openPayment, isPaymentOpen } = useCheckoutStore();
  const { openScanner } = useScannerStore();
  const { openProductModal } = useInventoryStore();
  const barcodeLookup = useBarcodeLookup();
  const productsQuery = usePosProducts({
    search: debouncedSearch,
    categoryId: activeCategoryId,
    limit: 90,
  });
  const products = productsQuery.data ?? [];
  const selectedProduct = products[selectedIndex];
  const cartTotals = getTotals();

  const resetBarcodeBuffer = useCallback(() => {
    barcodeBufferRef.current = "";
    barcodeFirstKeyAtRef.current = 0;
    barcodeLastKeyAtRef.current = 0;
    if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
  }, []);

  const handleScannedBarcode = useCallback(
    (rawCode: string) => {
      const barcode = normalizeScannedCode(rawCode);
      if (!barcode) return;

      scanQueueRef.current = scanQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const product = await barcodeLookup.mutateAsync(barcode);
            addItem(product);
            rememberProduct(product);
            toast.success(`${product.name} added`);
          } catch (error) {
            toast.error(
              getUserErrorMessage(
                error,
                "Barcode lookup failed. Please try again.",
              ),
            );
          }
        });
    },
    [addItem, barcodeLookup, rememberProduct],
  );

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
      const isSearchInput = target === searchInputRef.current;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

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

      const canCaptureScannerInput = !isTyping || isSearchInput;
      if (
        canCaptureScannerInput &&
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        const now = Date.now();
        if (now - barcodeLastKeyAtRef.current > 220) {
          barcodeBufferRef.current = "";
          barcodeFirstKeyAtRef.current = now;
        }
        if (!barcodeBufferRef.current) barcodeFirstKeyAtRef.current = now;
        barcodeBufferRef.current += event.key;
        barcodeLastKeyAtRef.current = now;
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        barcodeTimerRef.current = setTimeout(resetBarcodeBuffer, 260);
      }

      if (
        canCaptureScannerInput &&
        (event.key === "Enter" || event.key === "Tab") &&
        barcodeBufferRef.current
      ) {
        const submittedAt = Date.now();
        const barcode = barcodeBufferRef.current;
        const scannerBurst = isLikelyScannerBurst({
          code: barcode,
          firstKeyAt: barcodeFirstKeyAtRef.current,
          lastKeyAt: barcodeLastKeyAtRef.current,
          submittedAt,
        });

        if (scannerBurst) {
          event.preventDefault();
          event.stopPropagation();
          if (isSearchInput) setSearch("");
          resetBarcodeBuffer();
          handleScannedBarcode(barcode);
          return;
        }

        resetBarcodeBuffer();
      }

      if (event.key === "Enter" && selectedProduct && !isPaymentOpen) {
        event.preventDefault();
        if ((selectedProduct.stock_quantity ?? 0) <= 0) return;
        addItem(selectedProduct);
        rememberProduct(selectedProduct);
        return;
      }

      if (
        (event.key === "+" || event.key === "=") &&
        lastAddedProductId &&
        !isTyping
      ) {
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
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      resetBarcodeBuffer();
    };
  }, [
    decrementItem,
    handleScannedBarcode,
    incrementItem,
    isPaymentOpen,
    lastAddedProductId,
    moveSelection,
    openPayment,
    products,
    rememberProduct,
    resetBarcodeBuffer,
    selectedProduct,
    setSearch,
  ]);

  const visibleRecentProducts = useMemo(
    () =>
      recentProducts
        .filter(
          (product) =>
            !activeCategoryId || product.category_id === activeCategoryId,
        )
        .slice(0, 6),
    [activeCategoryId, recentProducts],
  );

  const addProduct = (product: (typeof products)[number]) => {
    if ((product.stock_quantity ?? 0) <= 0) return;
    addItem(product);
    rememberProduct(product);
  };

  return (
    <div className="flex h-[calc(100dvh-104px)] gap-4 overflow-hidden lg:h-[calc(100dvh-120px)] lg:gap-6">
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
            <Button
              variant="secondary"
              className="h-14 gap-2 px-5 font-bold"
              onClick={openScanner}
            >
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
                variant={
                  activeCategoryId === category.id ? "default" : "secondary"
                }
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
              <Button
                key={product.id}
                variant="outline"
                className="h-10 shrink-0 rounded-full"
                onClick={() => addProduct(product)}
              >
                {product.name}
              </Button>
            ))}
          </div>
        )}

        <ScrollArea className="flex-1">
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 15 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[4/3] animate-pulse rounded-lg border bg-muted"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-3xl bg-muted/20">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PackageSearch className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-black mb-2">Welcome to your POS</h3>
              {!search && !activeCategoryId ? (
                <div className="space-y-4 max-w-sm">
                  <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                    Your inventory is currently empty. To start selling, you
                    need to add your products first.
                  </p>
                  <Button
                    size="lg"
                    className="h-14 px-8 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    onClick={() => openProductModal()}
                  >
                    <Plus className="mr-2 h-6 w-6" />
                    Add My First Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-lg font-medium">
                    No products match your current search.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearch("");
                      setActiveCategoryId(null);
                    }}
                    className="font-bold"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-28 sm:grid-cols-3 lg:pb-8 xl:grid-cols-4 2xl:grid-cols-5">
              {products.map((product, index) => {
                const stock = Number(product.stock_quantity ?? 0);
                const isSelected = index === selectedIndex;
                const isOut = stock <= 0;

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      "group cursor-pointer overflow-hidden rounded-lg border-2 bg-card transition-all active:scale-[0.98]",
                      isSelected
                        ? "border-primary shadow-lg shadow-primary/10"
                        : "border-transparent hover:border-primary/40",
                      isOut && "cursor-not-allowed opacity-55 grayscale",
                    )}
                    onClick={() => addProduct(product)}
                  >
                    <div className="relative aspect-[4/3] bg-muted/50">
                      {product.image_url ? (
                        <Image
                          fill
                          src={product.image_url}
                          alt={product.name}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-6xl font-black uppercase text-muted-foreground/20">
                          {product.name.charAt(0)}
                        </div>
                      )}
                      {stock <= Number(product.low_stock_threshold ?? 0) &&
                        stock > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute right-2 top-2 text-[10px] uppercase"
                          >
                            {stock} left
                          </Badge>
                        )}
                      {isOut && (
                        <Badge
                          variant="destructive"
                          className="absolute left-2 top-2 uppercase"
                        >
                          Sold out
                        </Badge>
                      )}
                      {barcodeLookup.isPending && (
                        <Loader2 className="absolute bottom-2 right-2 h-4 w-4 animate-spin text-primary" />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="min-h-[44px]">
                        <h4 className="line-clamp-2 text-sm font-bold leading-tight group-hover:text-primary">
                          {product.name}
                        </h4>
                        <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {product.categories?.name ??
                            product.sku ??
                            "Uncategorized"}
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
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="hidden w-[410px] shrink-0 lg:block xl:w-[440px]">
        <CartSidebar />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 shadow-2xl backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-screen-sm items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">
              {cartTotals.itemCount} items in cart
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(cartTotals.total)}
            </p>
          </div>
          <Button
            className="h-11 px-5 font-black"
            onClick={() => setMobileCartOpen(true)}
          >
            Review
          </Button>
        </div>
      </div>
      <Dialog open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <DialogContent className="inset-x-2 top-4 flex h-[calc(100dvh-2rem)] max-w-none translate-x-0 translate-y-0 flex-col p-0 sm:left-[50%] sm:max-w-lg sm:-translate-x-1/2">
          <DialogTitle className="sr-only">Cart</DialogTitle>
          <CartSidebar />
        </DialogContent>
      </Dialog>
      <BarcodeScanner />
      <ProductForm />
    </div>
  );
}
