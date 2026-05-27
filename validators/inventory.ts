import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  category_id: z
    .string()
    .uuid("Please select a category")
    .optional()
    .nullable(),
  cost_price: z.coerce.number().min(0, "Cost price must be positive"),
  selling_price: z.coerce.number().min(0, "Selling price must be positive"),
  stock_quantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
  low_stock_threshold: z.coerce.number().int().min(0).default(5),
  expiry_date: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true),
  addition_date: z.string().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const adjustmentSchema = z.object({
  product_id: z.string().uuid(),
  quantity_change: z.coerce.number(),
  transaction_type: z.enum([
    "purchase",
    "sale",
    "adjustment",
    "return",
    "damage",
    "expiry",
  ]),
  notes: z.string().optional(),
  adjustment_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
});

export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;
