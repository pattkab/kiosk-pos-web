import { z } from "zod";

export const discountSchema = z.object({
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().min(0),
  reason: z.string().max(160).optional(),
});

export const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().min(0),
  unit_cost: z.number().min(0),
  discount_amount: z.number().min(0),
  tax_amount: z.number().min(0),
  line_total: z.number().min(0),
  note: z.string().max(280).optional(),
});

export const paymentSchema = z.object({
  payment_method: z.enum(["cash", "mobile_money", "card"]),
  amount: z.number().positive(),
  reference: z.string().max(120).optional(),
});

export const checkoutSchema = z.object({
  organization_id: z.string().uuid(),
  cashier_id: z.string().uuid(),
  session_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable(),
  subtotal: z.number().min(0),
  tax_amount: z.number().min(0),
  discount_amount: z.number().min(0),
  total_amount: z.number().positive(),
  items: z.array(cartItemSchema).min(1),
  payments: z.array(paymentSchema).min(1),
});

export const registerOpenSchema = z.object({
  opening_balance: z.coerce.number().min(0),
});

export const registerCloseSchema = z.object({
  actual_closing_balance: z.coerce.number().min(0),
  notes: z.string().max(500).optional(),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;
export type RegisterOpenValues = z.infer<typeof registerOpenSchema>;
export type RegisterCloseValues = z.infer<typeof registerCloseSchema>;
