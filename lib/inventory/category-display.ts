type ProductCategoryRelation =
  | { name: string }
  | { name: string }[]
  | null
  | undefined;

export function getProductCategoryName(
  product: {
    category_id?: string | null;
    categories?: ProductCategoryRelation;
  },
  categoryNameById?: Map<string, string>,
): string {
  const relation = product.categories;
  const joinedName = Array.isArray(relation)
    ? relation[0]?.name
    : relation?.name;
  if (joinedName) return joinedName;

  if (product.category_id && categoryNameById?.has(product.category_id)) {
    return categoryNameById.get(product.category_id)!;
  }

  return "Uncategorized";
}
