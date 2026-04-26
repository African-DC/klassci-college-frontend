"use client"

import { useMemo, useRef, useState, type ReactNode } from "react"
import {
  type ColumnDef,
  type SortingState,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataError } from "@/components/shared/DataError"
import type { PaginatedResponse } from "@/lib/contracts"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterConfig {
  key: string
  label: string
  type: "select" | "text"
  options?: { value: string; label: string }[]
  placeholder?: string
}

interface CrudTableProps<T extends { id: number }> {
  data: PaginatedResponse<T> | undefined
  columns: ColumnDef<T>[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  deleteMutation: {
    mutate: (id: number, options?: { onSuccess?: () => void }) => void
    isPending: boolean
  }
  renderEditModal: (props: { itemId: number | null; open: boolean; onClose: () => void }) => ReactNode
  renderViewModal?: (props: { itemId: number | null; open: boolean; onClose: () => void }) => ReactNode
  getItemLabel: (item: T) => string
  emptyMessage: string
  errorMessage: string
  deleteTitle?: string
  deleteDescription?: string
  onRowClick?: (item: T) => void
  page?: number
  onPageChange?: (page: number) => void
  // Search
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  // Filters
  filterConfigs?: FilterConfig[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
}

// ---------------------------------------------------------------------------
// Sort header helper
// ---------------------------------------------------------------------------

function SortableHeader({ column, children }: { column: { getIsSorted: () => false | "asc" | "desc"; getToggleSortingHandler: () => ((e: unknown) => void) | undefined }; children: ReactNode }) {
  const sorted = column.getIsSorted()
  return (
    <button
      type="button"
      className="flex items-center gap-1 hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded"
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5 text-primary" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5 text-primary" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// CrudTable
// ---------------------------------------------------------------------------

export function CrudTable<T extends { id: number }>({
  data,
  columns: userColumns,
  isLoading,
  isError,
  error,
  refetch,
  deleteMutation,
  renderEditModal,
  renderViewModal,
  getItemLabel,
  emptyMessage,
  errorMessage,
  deleteTitle = "Confirmer la suppression",
  deleteDescription = "Cette action est irréversible. L'élément sera définitivement supprimé.",
  onRowClick,
  page,
  onPageChange,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterConfigs,
  filterValues,
  onFilterChange,
}: CrudTableProps<T>) {
  const [viewId, setViewId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const getItemLabelRef = useRef(getItemLabel)
  getItemLabelRef.current = getItemLabel

  const hasSearch = !!onSearchChange
  const hasFilters = filterConfigs && filterConfigs.length > 0
  const hasToolbar = hasSearch || hasFilters

  const activeFilterCount = filterValues
    ? Object.values(filterValues).filter((v) => v && v !== "all").length
    : 0

  const columns = useMemo(() => {
    const actionColumn: ColumnDef<T> = {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const label = getItemLabelRef.current(row.original)
        return (
          <div className="flex items-center justify-end gap-1">
            {renderViewModal && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setViewId(row.original.id) }}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">Voir {label}</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditId(row.original.id) }}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Modifier {label}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setDeleteId(row.original.id) }}>
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="sr-only">Supprimer {label}</span>
            </Button>
          </div>
        )
      },
    }
    return [...userColumns, actionColumn]
  }, [userColumns])

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isError) {
    return <DataError message={error?.message ?? errorMessage} error={error} onRetry={refetch} />
  }

  return (
    <>
      {/* Toolbar : Search + Filters */}
      {hasToolbar && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            {hasSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder ?? "Rechercher..."}
                  value={searchValue ?? ""}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-9 h-10"
                />
                {searchValue && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => onSearchChange?.("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {hasFilters && (
              <Button
                variant={filtersOpen || activeFilterCount > 0 ? "default" : "outline"}
                size="sm"
                className="h-10 gap-2"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            )}
          </div>

          {/* Filter panel */}
          {hasFilters && filtersOpen && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filterConfigs!.map((filter) => (
                  <div key={filter.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      {filter.label}
                    </label>
                    {filter.type === "select" && filter.options ? (
                      <Select
                        value={filterValues?.[filter.key] ?? "all"}
                        onValueChange={(v) => onFilterChange?.(filter.key, v === "all" ? "" : v)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder={filter.placeholder ?? "Tous"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {filter.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={filterValues?.[filter.key] ?? ""}
                        onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                        placeholder={filter.placeholder ?? `Filtrer par ${filter.label.toLowerCase()}`}
                        className="h-9 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      filterConfigs!.forEach((f) => onFilterChange?.(f.key, ""))
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : header.column.getCanSort()
                        ? (
                          <SortableHeader column={header.column}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </SortableHeader>
                        )
                        : flexRender(header.column.columnDef.header, header.getContext())
                    }
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.size > 0 && Math.ceil(data.total / data.size) > 1 && onPageChange && (() => {
        const totalPages = Math.ceil(data.total / data.size)
        return (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Page {data.page} sur {totalPages} — {data.total} résultat{data.total > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(data.page - 1)}
                disabled={data.page <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(data.page + 1)}
                disabled={data.page >= totalPages}
              >
                Suivant
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })()}

      {renderViewModal?.({ itemId: viewId, open: viewId !== null, onClose: () => setViewId(null) })}
      {renderEditModal({ itemId: editId, open: editId !== null, onClose: () => setEditId(null) })}

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deleteTitle}</DialogTitle>
            <DialogDescription>{deleteDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
                }
              }}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
