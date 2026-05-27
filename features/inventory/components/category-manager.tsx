"use client";

import { useCategories } from "@/hooks/use-inventory";
import { useInventoryStore } from "@/store/use-inventory-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Pencil } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function CategoryManager() {
  const { categoryModalOpen, closeCategoryModal } = useInventoryStore();
  const { data: categories, isLoading } = useCategories();
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const handleAdd = async () => {
    if (!newName) return;
    setIsSubmitting(true);
    try {
      const { data: org } = await supabase.from('organization_members').select('organization_id').single();
      const { error } = await supabase.from("categories").insert({
        name: newName,
        organization_id: org?.organization_id,
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? Products in this category will become uncategorized.")) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={categoryModalOpen} onOpenChange={closeCategoryModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
            <div className="max-h-[300px] overflow-y-auto rounded-md border p-2">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
              ) : categories?.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No categories yet.</div>
              ) : (
                <div className="space-y-1">
                  {categories?.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(cat.id)}>
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
