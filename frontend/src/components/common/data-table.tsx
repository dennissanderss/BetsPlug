"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface Column<T> {
  label: string;
  accessor: keyof T | string;
  className?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  className?: string;
  rowKey?: (row: T, index: number) => string | number;
}

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available.",
  pageSize = 10,
  className,
  rowKey,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pageData = data.slice(startIndex, startIndex + pageSize);

  // Reset to page 1 when data changes
  React.useEffect(() => {
    setPage(1);
  }, [data]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Table wrapper */}
      <div className="w-full overflow-auto rounded-full border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: pageSize }).map((_, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-border last:border-0"
                >
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row, rowIdx) => {
                const key = rowKey
                  ? rowKey(row, startIndex + rowIdx)
                  : startIndex + rowIdx;
                return (
                  <tr
                    key={key}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      "hover:bg-muted/40"
                    )}
                  >
                    {columns.map((col, colIdx) => {
                      const value = getNestedValue(row, String(col.accessor));
                      return (
                        <td
                          key={colIdx}
                          className={cn(
                            "px-4 py-3 text-foreground",
                            col.className
                          )}
                        >
                          {col.render
                            ? col.render(value, row)
                            : value !== undefined && value !== null
                            ? String(value)
                            : "-"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && data.length > pageSize && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Showing {startIndex + 1}–{Math.min(startIndex + pageSize, data.length)} of{" "}
            {data.length} results
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
