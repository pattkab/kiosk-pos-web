import { z } from "zod";

export const loyaltySettingsSchema = z.object({
  loyalty_enabled: z.boolean(),
  loyalty_earn_points_per_unit: z.coerce.number().int().min(1).max(100000),
  loyalty_earn_spend_unit: z.coerce.number().min(0.01).max(100000000),
  loyalty_redeem_points_unit: z.coerce.number().int().min(1).max(1000000),
  loyalty_redeem_value_unit: z.coerce.number().min(0.01).max(100000000),
  loyalty_min_redeem_points: z.coerce.number().int().min(1).max(1000000),
  loyalty_max_redeem_percent: z.coerce.number().min(1).max(100),
});

export type LoyaltySettingsValues = z.infer<typeof loyaltySettingsSchema>;

export const customerSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
