export type PosCatalogView = "grid" | "list";

export const POS_CATALOG_VIEW_STORAGE_KEY = "pos-catalog-view";

export function getPosCatalogView(): PosCatalogView {
  if (typeof window === "undefined") return "grid";
  const stored = localStorage.getItem(POS_CATALOG_VIEW_STORAGE_KEY);
  return stored === "list" ? "list" : "grid";
}

export function setPosCatalogView(view: PosCatalogView) {
  localStorage.setItem(POS_CATALOG_VIEW_STORAGE_KEY, view);
}
