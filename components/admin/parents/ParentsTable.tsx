"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import type { Route } from "next"
import { Phone, Mail } from "lucide-react"
import { useParents, useDeleteParent } from "@/lib/hooks/useParents"
import type { Parent } from "@/lib/contracts/parent"
import { CrudTable } from "@/components/shared/CrudTable"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { ParentEditModal } from "./ParentEditModal"

export function ParentsTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)

  const params = useMemo(() => ({
    page,
    ...(debouncedSearch && { search: debouncedSearch }),
  }), [page, debouncedSearch])

  const { data, isLoading, isError, error, refetch } = useParents(params)
  const deleteMutation = useDeleteParent()

  const columns: ColumnDef<Parent>[] = useMemo(() => [
    {
      accessorKey: "last_name",
      header: "Nom",
      cell: ({ row }) => {
        const p = row.original
        const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-border">
              <span className="text-xs font-semibold text-primary">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{p.last_name} {p.first_name}</p>
              {p.email && (
                <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Téléphone",
      cell: ({ row }) => {
        const phone = row.original.phone
        if (!phone) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <a
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Phone className="h-3.5 w-3.5" />
            {phone}
          </a>
        )
      },
    },
    {
      accessorKey: "city",
      header: "Localisation",
      cell: ({ row }) => {
        const p = row.original
        const loc = [p.city, p.commune].filter(Boolean).join(" / ")
        return <span className="text-sm text-muted-foreground">{loc || "—"}</span>
      },
    },
    {
      accessorKey: "user_id",
      header: "Compte",
      cell: ({ row }) => {
        const hasAccount = !!row.original.user_id
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            {hasAccount ? "Avec compte" : "Sans compte"}
          </div>
        )
      },
    },
  ], [])

  return (
    <CrudTable<Parent>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      deleteMutation={deleteMutation}
      onRowClick={(item) => router.push(`/admin/parents/${item.id}` as Route)}
      renderEditModal={({ itemId, open, onClose }) => (
        <ParentEditModal parentId={itemId} open={open} onClose={onClose} />
      )}
      getItemLabel={(p) => `${p.last_name} ${p.first_name}`}
      emptyMessage="Aucun parent trouvé"
      errorMessage="Impossible de charger les parents"
      deleteDescription="Cette action est irréversible. Le parent sera définitivement supprimé et les liens avec les enfants retirés."
      searchPlaceholder="Rechercher un parent (nom, prénom, téléphone)..."
      searchValue={search}
      onSearchChange={(v) => { setSearch(v); setPage(1) }}
      page={page}
      onPageChange={setPage}
    />
  )
}
