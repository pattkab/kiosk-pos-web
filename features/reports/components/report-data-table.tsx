"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCsv } from "@/lib/reports/export";
import { ArrowDownUp, Download, Search } from "lucide-react";

export interface ReportColumn<T> {
  key: keyof T & string;
  label: string;
  render?: (row: T) => React.ReactNode;
  exportValue?: (row: T) => string | number | null;
  align?: "left" | "right";
}

interface ReportDataTableProps<T extends Record<string, unknown>> {
  title: string;
  rows: T[];
  columns: ReportColumn<T>[];
  filename: string;
  pageSize?: number;
}

export function ReportDataTable<T extends Record<string, unknown>>({
  title,
  rows,
  columns,
  filename,
  pageSize = 10,
}: ReportDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T & string>(columns[0]?.key);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const matched = normalized
      ? rows.filter((row) =>
          columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(normalized))
        )
      : rows;

    return [...matched].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      const direction = sortDirection === "asc" ? 1 : -1;
      if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
      return String(left ?? "").localeCompare(String(right ?? "")) * direction;
    });
  }, [columns, rows, search, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const exportRows = () => {
    downloadCsv(
      filename,
      filteredRows.map((row) =>
        Object.fromEntries(
          columns.map((column) => [
            column.label,
            column.exportValue ? column.exportValue(row) : (row[column.key] as string | number | null),
          ])
        )
      )
    );
  };

  const toggleSort = (key: keyof T & string) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("desc");
  };

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9 sm:w-[260px]"
              placeholder="Search table"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button variant="outline" className="h-10 gap-2" onClick={exportRows} disabled={filteredRows.length === 0}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.align === "right" ? "text-right" : undefined}>
                  <button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort(column.key)}>
                    {column.label}
                    <ArrowDownUp className="h-3 w-3" />
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">
                  No report rows found.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, index) => (
                <TableRow key={String(row.id ?? row.sale_id ?? row.product_id ?? row.session_id ?? index)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.align === "right" ? "text-right" : undefined}>
                      {column.render ? column.render(row) : String(row[column.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredRows.length} row{filteredRows.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
