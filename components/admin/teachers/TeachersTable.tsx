"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import type { ColumnDef } from "@tanstack/react-table"
import { Phone, MessageCircle, Mail } from "lucide-react"
import { useInfiniteTeachers, useDeleteTeacher } from "@/lib/hooks/useTeachers"
import { teacherContractLabel, type Teacher } from "@/lib/contracts/teacher"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { DirectoryFiltersBar } from "@/components/shared/list/DirectoryFiltersBar"
import { MobileEntityListItem } from "@/components/shared/MobileEntityListItem"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { TeacherEditModal } from "./TeacherEditModal"
import { getUploadUrl, cn } from "@/lib/utils"

// Avatar avec photo si disponible, fallback initiales propre.
function TeacherAvatar({ teacher, size = "md" }: { teacher: Teacher; size?: "sm" | "md" }) {
  const initials = `${teacher.first_name?.[0] ?? ""}${teacher.last_name?.[0] ?? ""}`.toUpperCase()
  const photoSrc = getUploadUrl((teacher as Record<string, unknown>).photo_url as string | null | undefined)
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-10 w-10"
  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt={`${teacher.first_name} ${teacher.last_name}`}
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

// Actions inline Wave-style : Appeler / WhatsApp / Email — touch targets h-9 desktop,
// affichées uniquement quand la donnée est disponible. Sur mobile, l'utilisateur
// tap la ligne pour aller à la fiche où les actions sont en plus grand (h-11).
function ContactActions({ teacher }: { teacher: Teacher }) {
  const phone = teacher.phone?.trim()
  const phoneDigits = phone?.replace(/[^\d]/g, "")
  const email = (teacher as Record<string, unknown>).email as string | undefined

  if (!phone && !email) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label={`Appeler ${teacher.first_name} ${teacher.last_name}`}
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
          aria-label={`WhatsApp ${teacher.first_name} ${teacher.last_name}`}
          title="WhatsApp"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          aria-label={`Envoyer un email à ${teacher.first_name} ${teacher.last_name}`}
          title="Email"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

export function TeachersTable() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)

  const params = useMemo(() => ({
    ...(debouncedSearch && { search: debouncedSearch }),
  }), [debouncedSearch])

  const { data, isLoading, isError, error, refetch, scrollInfini } = useInfiniteTeachers(params)
  const deleteMutation = useDeleteTeacher()

  const columns: ColumnDef<Teacher>[] = useMemo(() => [
    {
      accessorKey: "last_name",
      header: "Nom",
      cell: ({ row }) => {
        const t = row.original
        return (
          <div className="flex items-center gap-3">
            <TeacherAvatar teacher={t} />
            <div className="min-w-0">
              <p className="font-medium truncate">{t.last_name} {t.first_name}</p>
              {t.speciality && (
                <p className="text-[10px] text-muted-foreground">{t.speciality}</p>
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
      accessorKey: "contract_type",
      header: "Contrat",
      cell: ({ row }) => {
        const label = teacherContractLabel(row.original.contract_type)
        if (!label) {
          return <span className="text-sm text-muted-foreground">—</span>
        }
        return (
          <Badge variant="secondary" className="text-xs font-normal">
            {label}
          </Badge>
        )
      },
    },
    {
      id: "actions_contact",
      header: "Contact",
      cell: ({ row }) => <ContactActions teacher={row.original} />,
    },
  ], [])

  const items = data?.items ?? []

  return (
    <div className="space-y-4">
      <DirectoryFiltersBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher un enseignant..."
      />
      {/* Desktop : table dense via CrudTable. Mobile : liste minimale via
          MobileEntityListItem. Tailwind hidden classes = display:none, zero JS,
          un seul layout visible à la fois. */}
      <div className="hidden md:block">
        <CrudTable<Teacher>
          data={data}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          deleteMutation={deleteMutation}
          onRowClick={(item) => router.push(`/admin/teachers/${item.id}`)}
          renderEditModal={({ itemId, open, onClose }) => (
            <TeacherEditModal teacherId={itemId} open={open} onClose={onClose} />
          )}
          getItemLabel={(t) => `${t.last_name} ${t.first_name}`}
          emptyMessage="Aucun enseignant trouvé"
          errorMessage="Impossible de charger les enseignants"
          deleteDescription="Cette action est irréversible. L'enseignant sera définitivement supprimé."
          scrollInfini={scrollInfini}
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
            Aucun enseignant trouvé
          </p>
        )}
        {items.map((t) => (
          <MobileEntityListItem
            key={t.id}
            href={`/admin/teachers/${t.id}` as Route}
            avatar={<TeacherAvatar teacher={t} size="sm" />}
            primary={
              <>
                {t.last_name} {t.first_name}
              </>
            }
            secondary={t.speciality || (t.phone ? <span className="tabular-nums">{t.phone}</span> : null)}
          />
        ))}
      </div>
    </div>
  )
}
