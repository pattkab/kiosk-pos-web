"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Layers3, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCategorySeedsForBusinessType,
  getSeedCategoryKey,
} from "@/lib/category-taxonomy";
import { getBusinessTypeLabel } from "@/lib/business-types";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/hooks/use-inventory";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useInventoryStore } from "@/store/use-inventory-store";
import { useOrganizationStore } from "@/store/use-organization-store";

export function CategoryManager() {
  const { categoryModalOpen, closeCategoryModal } = useInventoryStore();
  const { data: categories, isLoading } = useCategories();
  const { activeOrganization } = useActiveOrganization();
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();
  const activeOrganizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  const recommendedCategories = getCategorySeedsForBusinessType(
    activeOrganization?.business_type,
  );
  const existingSeedKeys = new Set(
    (categories ?? []).map((category) =>
      getSeedCategoryKey({
        department: category.description || "Custom categories",
        name: category.name,
      }),
    ),
  );
  const existingNames = new Set(
    (categories ?? []).map((category) => category.name.toLowerCase()),
  );
  const missingRecommendedCount = recommendedCategories.filter(
    (category) =>
      !existingSeedKeys.has(getSeedCategoryKey(category)) &&
      !existingNames.has(category.name.toLowerCase()),
  ).length;
  const categoriesByDepartment = useMemo(() => {
    return (categories ?? []).reduce<
      Record<string, NonNullable<typeof categories>>
    >((groups, category) => {
      const department = category.description?.trim() || "Custom categories";
      groups[department] = [...(groups[department] ?? []), category];
      return groups;
    }, {});
  }, [categories]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (!activeOrganizationId) {
      toast.error("Select an organization before adding categories.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("categories").insert({
        name,
        organization_id: activeOrganizationId,
      });
      if (error) throw error;
      toast.success("Category added");
      setNewName("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!activeOrganizationId) {
      toast.error("Select an organization before adding categories.");
      return;
    }

    setIsSeeding(true);
    try {
      const { data, error } = await supabase.rpc(
        "seed_default_categories_for_organization",
        {
          p_organization_id: activeOrganizationId,
          p_business_type: activeOrganization?.business_type ?? "other",
        },
      );
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(
        Number(data ?? 0) > 0
          ? `${data} recommended categories added`
          : "Recommended categories are already set up",
      );
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure? Products in this category will become uncategorized.",
      )
    )
      return;
    try {
      let query = supabase.from("categories").delete().eq("id", id);
      if (activeOrganizationId)
        query = query.eq("organization_id", activeOrganizationId);
      const { error } = await query;
      if (error) throw error;
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={categoryModalOpen} onOpenChange={closeCategoryModal}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black">
                  {getBusinessTypeLabel(activeOrganization?.business_type)}{" "}
                  starter categories
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add recommended departments and categories for faster product
                  setup and cleaner reports.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 font-bold"
                onClick={handleSeedDefaults}
                disabled={isSeeding || missingRecommendedCount === 0}
              >
                <Layers3 className="mr-2 h-4 w-4" />
                {missingRecommendedCount > 0
                  ? `Add ${missingRecommendedCount}`
                  : "Up to date"}
              </Button>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="category-name">New Category</Label>
              <Input
                id="category-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Beverages"
              />
            </div>
            <Button onClick={handleAdd} disabled={isSubmitting}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Existing Categories</Label>
            <div className="max-h-[360px] overflow-y-auto rounded-md border p-2">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : categories?.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No categories yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(categoriesByDepartment).map(
                    ([department, items]) => (
                      <div key={department}>
                        <div className="px-2 pb-1 text-xs font-black uppercase tracking-widest text-muted-foreground">
                          {department}
                        </div>
                        <div className="space-y-1">
                          {items.map((cat) => (
                            <div
                              key={cat.id}
                              className="flex items-center justify-between rounded-md p-2 transition hover:bg-muted/50"
                            >
                              <span className="text-sm font-medium">
                                {cat.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(cat.id)}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
