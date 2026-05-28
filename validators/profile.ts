import { z } from "zod";

const avatarUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.length === 0 ||
      value.startsWith("/avatars/") ||
      /^https?:\/\//i.test(value),
    "Choose an avatar or upload a valid image.",
  );

export const userProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters."),
  phone: z.string().trim().max(40, "Phone number is too long.").optional(),
  avatar_url: avatarUrlSchema.optional(),
});

export type UserProfileValues = z.infer<typeof userProfileSchema>;
