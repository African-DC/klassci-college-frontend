"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import type { Route } from "next"
import { Phone, Mail, MessageCircle, UserCircle2 } from "lucide-react"
import { useParents, useDeleteParent } from "@/lib/hooks/useParents"
import type { Parent } from "@/lib/contracts/parent"
import type { PaginatedResponse } from "@/lib/contracts"
import { CrudTable } from "@/components/shared/CrudTable"
import { FilterChips } from "@/components/shared/list/FilterChips"
import { MobileEntityListItem } from "@/components/shared/MobileEntityListItem"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { ParentEditModal } from "./ParentEditModal"

type AccountFilter = "all" | "with" | "without"

// Actions inline Wave-style : Appeler / WhatsApp / Email
function ContactActions({ parent }: { parent: Parent }) {
  const phone = parent.phone?.trim()
  const phoneDigits = phone?.replace(/[^\d]/g, "")
  const email = parent.email

  if (!phone && !email) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label={`Appeler ${parent.first_name} ${parent.last_name}`}
          title="Appeler"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
      {phoneDigits && (
        <a
          href={`https://wa.me/${phoneDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp ${parent.first_name} ${parent.last_name}`}
          title="WhatsApp"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          aria-label={`Envoyer un email à ${parent.first_name} ${parent.last_name}`}
          title="Email"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

function ParentAvatar({ parent }: { parent: Parent }) {
  const initials = `${parent.first_name?.[0] ?? ""}${parent.last_name?.[0] ?? ""}`.toUpperCase()
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-border">
      <span className="text-xs font-semibold text-primary">{initials}</span>
    </div>
  )
}

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

  // Filtre compte (avec/sans) appliqué côté client sur la page chargée.
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all")
  const rawItems = useMemo(() => data?.items ?? [], [data])
  const withAccountCount = useMemo(() => rawItems.filter((p) => !!p.user_id).length, [rawItems])
  const filteredItems = useMemo(() => {
    if (accountFilter === "with") return rawItems.filter((p) => !!p.user_id)
    if (accountFilter === "without") return rawItems.filter((p) => !p.user_id)
    return rawItems
  }, [rawItems, accountFilter])
  const tableData: PaginatedResponse<Parent> | undefined = data
    ? { ...data, items: filteredItems }
    : undefined

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
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">{row.original.phone ?? "—"}</span>
      ),
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
      id: "contact_actions",
      header: "Contact",
      cell: ({ row }) => <ContactActions parent={row.original} />,
    },
    {
      accessorKey: "user_id",
      header: "Compte",
      cell: ({ row }) => {
        const hasAccount = !!row.original.user_id
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCircle2 className="h-3 w-3" aria-hidden="true" />
            {hasAccount ? "Avec compte" : "Sans compte"}
          </div>
        )
      },
    },
  ], [])

  return (
    <div className="space-y-4">
      <FilterChips
        aria-label="Filtrer par compte"
        value={accountFilter}
        onChange={(v) => setAccountFilter(v as AccountFilter)}
        options={[
          { value: "all", label: "Tous", count: rawItems.length },
          { value: "with", label: "Avec compte", count: withAccountCount, tone: "default" },
          { value: "without", label: "Sans compte", count: rawItems.length - withAccountCount, tone: "warning" },
        ]}
      />
      <div className="hidden md:block">
        <CrudTable<Parent>
          data={tableData}
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
      </div>

      <div className="space-y-2 md:hidden">
        {isLoading && (
          <p className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Chargement…
          </p>
        )}
        {!isLoading && filteredItems.length === 0 && (
          <p className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Aucun parent trouvé
          </p>
        )}
        {filteredItems.map((p) => {
          const loc = [p.city, p.commune].filter(Boolean).join(" / ")
          return (
            <MobileEntityListItem
              key={p.id}
              href={`/admin/parents/${p.id}` as Route}
              avatar={<ParentAvatar parent={p} />}
              primary={
                <>
                  {p.last_name} {p.first_name}
                </>
              }
              secondary={loc || p.phone || p.email || null}
              status={
                p.user_id ? (
                  <span className="inline-flex h-6 items-center rounded-full bg-emerald-100 px-2 text-[10px] font-medium text-emerald-700">
                    Compte actif
                  </span>
                ) : null
              }
            />
          )
        })}
      </div>
    </div>
  )
}
