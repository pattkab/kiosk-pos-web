import { z } from "zod";
import { businessTypeValues } from "@/lib/business-types";

export const organizationProfileSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  business_type: z.enum(businessTypeValues),
  logo_url: z.string().url().optional().or(z.literal("")),
  currency: z.string().min(3).max(3),
  timezone: z.string().min(1),
  address: z.string().max(240).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  tax_id: z.string().max(80).optional().or(z.literal("")),
});

export const organizationSettingsSchema = z.object({
  tax_rate: z.coerce.number().min(0).max(100),
  receipt_header: z.string().max(500).optional().or(z.literal("")),
  receipt_footer: z.string().max(500).optional().or(z.literal("")),
  low_stock_threshold_default: z.coerce.number().int().min(0),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "cashier"]),
});

export type OrganizationProfileValues = z.infer<
  typeof organizationProfileSchema
>;
export type OrganizationSettingsValues = z.infer<
  typeof organizationSettingsSchema
>;
export type InviteMemberValues = z.infer<typeof inviteMemberSchema>;
