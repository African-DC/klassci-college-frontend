"use client"

import { useMemo, useRef, useState, type ReactNode } from "react"
import {
  type ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  getItemLabel: (item: T) => string
  emptyMessage: string
  errorMessage: string
  deleteTitle?: string
  deleteDescription?: string
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
  getItemLabel,
  emptyMessage,
  errorMessage,
  deleteTitle = "Confirmer la suppression",
  deleteDescription = "Cette action est irréversible. L'élément sera définitivement supprimé.",
}: CrudTableProps<T>) {
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Ref stable pour éviter l'invalidation du useMemo à chaque rendu
  const getItemLabelRef = useRef(getItemLabel)
  getItemLabelRef.current = getItemLabel

  const columns = useMemo(() => {
    const actionColumn: ColumnDef<T> = {
      id: "actions",
      cell: ({ row }) => {
        const label = getItemLabelRef.current(row.original)
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions pour ${label}`}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions pour {label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditId(row.original.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(row.original.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }
    return [...userColumns, actionColumn]
  }, [userColumns])

  const table = useReactTable({
    data: data?.data ?? [],
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
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
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
