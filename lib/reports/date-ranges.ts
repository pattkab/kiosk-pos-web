import { ReportDateRange, ReportPreset } from "@/types/reports";

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  return next;
};

const endOfWeek = (date: Date) => {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  return next;
};

export function getPresetDateRange(preset: ReportPreset): ReportDateRange {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  if (preset === "yesterday") {
    start.setDate(today.getDate() - 1);
    end.setDate(today.getDate() - 1);
  }

  if (preset === "this_week") {
    return { preset, startDate: toDateInputValue(startOfWeek(today)), endDate: toDateInputValue(endOfWeek(today)) };
  }

  if (preset === "last_week") {
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    return { preset, startDate: toDateInputValue(startOfWeek(lastWeek)), endDate: toDateInputValue(endOfWeek(lastWeek)) };
  }

  if (preset === "this_month") {
    start.setDate(1);
    end.setMonth(today.getMonth() + 1, 0);
  }

  if (preset === "last_month") {
    start.setMonth(today.getMonth() - 1, 1);
    end.setMonth(today.getMonth(), 0);
  }

  return {
    preset,
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}

export const reportPresetLabels: Record<ReportPreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  last_week: "Last week",
  this_month: "This month",
  last_month: "Last month",
  custom: "Custom",
};
