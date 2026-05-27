"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPresetDateRange, reportPresetLabels } from "@/lib/reports/date-ranges";
import { ReportDateRange, ReportPreset } from "@/types/reports";

const presets = Object.keys(reportPresetLabels) as ReportPreset[];

interface ReportDateFilterProps {
  value: ReportDateRange;
  onChange: (range: ReportDateRange) => void;
}

export function ReportDateFilter({ value, onChange }: ReportDateFilterProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-end">
      <div className="min-w-[180px] space-y-1.5">
        <Label className="text-xs font-bold uppercase text-muted-foreground">Period</Label>
        <Select
          value={value.preset}
          onValueChange={(preset: ReportPreset) => onChange(getPresetDateRange(preset))}
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset} value={preset}>
                {reportPresetLabels[preset]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase text-muted-foreground">Start</Label>
        <Input
          className="h-10"
          type="date"
          value={value.startDate}
          onChange={(event) => onChange({ ...value, preset: "custom", startDate: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase text-muted-foreground">End</Label>
        <Input
          className="h-10"
          type="date"
          value={value.endDate}
          onChange={(event) => onChange({ ...value, preset: "custom", endDate: event.target.value })}
        />
      </div>
    </div>
  );
}
