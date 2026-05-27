import { z } from "zod";

export const reportPresetSchema = z.enum([
  "today",
  "yesterday",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "custom",
]);

export const reportDateRangeSchema = z
  .object({
    preset: reportPresetSchema,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "Start date must be before end date",
    path: ["startDate"],
  });

export const reportExportSchema = z.object({
  filename: z.string().min(1),
  columns: z.array(z.string()).min(1),
  rows: z.array(z.record(z.string(), z.string().or(z.number()).or(z.null()))),
});

export type ReportDateRangeValues = z.infer<typeof reportDateRangeSchema>;
