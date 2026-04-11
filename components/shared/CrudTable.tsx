"use client"

import { useMemo, useRef, useState, type ReactNode } from "react"
import {
  type ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// Dropdown imports removed — inline action buttons are more discoverable
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
}

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
}: CrudTableProps<T>) {
  const [viewId, setViewId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Ref stable pour éviter l'invalidation du useMemo à chaque rendu
  const getItemLabelRef = useRef(getItemLabel)
  getItemLabelRef.current = getItemLabel

  const columns = useMemo(() => {
    const actionColumn: ColumnDef<T> = {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
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
    getCoreRowModel: getCoreRowModel(),
  })

  if (isError) {
    return <DataError message={error?.message ?? errorMessage} onRetry={refetch} />
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
