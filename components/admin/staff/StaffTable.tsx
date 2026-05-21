"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import type { Route } from "next"
import { Phone, MessageCircle, Mail } from "lucide-react"
import { useStaffList, useDeleteStaff } from "@/lib/hooks/useStaff"
import type { Staff } from "@/lib/contracts/staff"
import { CrudTable, type FilterConfig } from "@/components/shared/CrudTable"
import { MobileEntityListItem } from "@/components/shared/MobileEntityListItem"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { StaffEditModal } from "./StaffEditModal"
import { getUploadUrl, cn } from "@/lib/utils"

function StaffAvatar({ staff, size = "md" }: { staff: Staff; size?: "sm" | "md" }) {
  const initials = `${staff.first_name?.[0] ?? ""}${staff.last_name?.[0] ?? ""}`.toUpperCase()
  const photoSrc = getUploadUrl((staff as Record<string, unknown>).photo_url as string | null | undefined)
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-10 w-10"
  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt={`${staff.first_name} ${staff.last_name}`}
        className={cn(sizeClass, "shrink-0 rounded-lg object-cover border border-border")}
      />
    )
  }
  return (
    <div className={cn(sizeClass, "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-border")}>
      <span className="text-xs font-semibold text-primary">{initials}</span>
    </div>
  )
}

function ContactActions({ staff }: { staff: Staff }) {
  const phone = staff.phone?.trim()
  const phoneDigits = phone?.replace(/[^\d]/g, "")
  const email = (staff as Record<string, unknown>).email as string | undefined

  if (!phone && !email) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label={`Appeler ${staff.first_name} ${staff.last_name}`}
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
          aria-label={`WhatsApp ${staff.first_name} ${staff.last_name}`}
          title="WhatsApp"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          aria-label={`Envoyer un email à ${staff.first_name} ${staff.last_name}`}
          title="Email"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

export function StaffTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const debouncedSearch = useDebounce(search)

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }, [])

  const params = useMemo(() => ({
    page,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filters.position && { position: filters.position }),
  }), [page, debouncedSearch, filters])

  const { data, isLoading, isError, error, refetch } = useStaffList(params)
  const deleteMutation = useDeleteStaff()

  const filterConfigs: FilterConfig[] = useMemo(() => [
    { key: "position", label: "Poste", type: "text", placeholder: "Filtrer par poste..." },
  ], [])

  const columns: ColumnDef<Staff>[] = useMemo(() => [
    {
      accessorKey: "last_name",
      header: "Nom",
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-3">
            <StaffAvatar staff={s} />
            <div className="min-w-0">
              <p className="font-medium truncate">{s.last_name} {s.first_name}</p>
              {s.position && (
                <p className="text-[10px] text-muted-foreground">{s.position}</p>
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
      id: "contact_actions",
      header: "Contact",
      cell: ({ row }) => <ContactActions staff={row.original} />,
    },
  ], [])

  const items = data?.items ?? []

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <CrudTable<Staff>
          data={data}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          deleteMutation={deleteMutation}
          onRowClick={(item) => router.push(`/admin/staff/${item.id}`)}
          renderEditModal={({ itemId, open, onClose }) => (
            <StaffEditModal staffId={itemId} open={open} onClose={onClose} />
          )}
          getItemLabel={(s) => `${s.last_name} ${s.first_name}`}
          emptyMessage="Aucun personnel trouvé"
          errorMessage="Impossible de charger le personnel"
          deleteDescription="Cette action est irréversible. Le membre du personnel sera définitivement supprimé."
          searchPlaceholder="Rechercher un membre du personnel..."
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          page={page}
          onPageChange={setPage}
          filterConfigs={filterConfigs}
          filterValues={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="space-y-2 md:hidden">
        {isLoading && (
          <p className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Chargement…
          </p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Aucun personnel trouvé
          </p>
        )}
        {items.map((s) => (
          <MobileEntityListItem
            key={s.id}
            href={`/admin/staff/${s.id}` as Route}
            avatar={<StaffAvatar staff={s} size="sm" />}
            primary={
              <>
                {s.last_name} {s.first_name}
              </>
            }
            secondary={s.position || (s.phone ? <span className="tabular-nums">{s.phone}</span> : null)}
          />
        ))}
      </div>
    </div>
  )
}
