import { z } from "zod";
import { businessTypeValues } from "@/lib/business-types";
import { DEFAULT_APPEARANCE_COLORS } from "@/lib/appearance";

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color.");

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
  receipt_logo_url: z.string().url().optional().or(z.literal("")).or(z.null()),
  receipt_notes: z.string().max(2000).optional().or(z.literal("")),
  low_stock_threshold_default: z.coerce.number().int().min(0),
  theme_primary_color: hexColorSchema.optional(),
  theme_accent_color: hexColorSchema.optional(),
  role_permissions: z
    .object({
      owner: z.array(z.string()).optional(),
      admin: z.array(z.string()).optional(),
      manager: z.array(z.string()).optional(),
      cashier: z.array(z.string()).optional(),
    })
    .optional(),
  stripe_customer_id: z.string().optional(),
  stripe_subscription_id: z.string().optional(),
});

export const organizationAppearanceSchema = z.object({
  theme_primary_color: hexColorSchema.default(
    DEFAULT_APPEARANCE_COLORS.primary,
  ),
  theme_accent_color: hexColorSchema.default(DEFAULT_APPEARANCE_COLORS.accent),
});

export const organizationBrandingSchema = z.object({
  logo_url: z.string().url().optional().or(z.literal("")).or(z.null()),
});

export const inviteMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  role: z.enum(["admin", "manager", "cashier"]),
});

export type OrganizationProfileValues = z.infer<
  typeof organizationProfileSchema
>;
export type OrganizationSettingsValues = z.infer<
  typeof organizationSettingsSchema
>;
export type OrganizationAppearanceValues = z.infer<
  typeof organizationAppearanceSchema
>;
export type OrganizationBrandingValues = z.infer<
  typeof organizationBrandingSchema
>;
export type InviteMemberValues = z.infer<typeof inviteMemberSchema>;
