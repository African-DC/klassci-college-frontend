"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  Pencil,
  Trash2,
  Users,
  Mail,
  MoreVertical,
  MapPin,
  CalendarDays,
  ShieldCheck,
  UserPlus,
  Wallet,
  Coins,
} from "lucide-react"
import type { Route } from "next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataError } from "@/components/shared/DataError"
import { DetailHero } from "@/components/shared/DetailHero"
import { AccountSection } from "@/components/shared/account/AccountSection"
import { ContactActions } from "@/components/shared/ContactActions"
import { ArchiveActionDialog, ARCHIVE_MENU_LABEL } from "@/components/shared/ArchiveActionDialog"
import { useArchiveAction } from "@/lib/hooks/useArchiveAction"
import type { HeroKpi } from "@/components/shared/PageHero"
import { useParent, useParentFull, useDeleteParent, useUnlinkParent } from "@/lib/hooks/useParents"
import { formatXof } from "@/lib/export/format"
import type { ParentChild } from "@/lib/contracts/parent"
import { ParentEditModal } from "./ParentEditModal"
import { ParentLinkChildModal } from "./ParentLinkChildModal"
import { ParentChildCard } from "./ParentChildCard"

export function ParentDetailClient({ parentId }: { parentId: number }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [unlinkTarget, setUnlinkTarget] = useState<ParentChild | null>(null)

  const { data: parent, isLoading, isError, refetch } = useParent(parentId)
  const { data: full } = useParentFull(parentId)
  const { mutate: deleteParent, isPending: deleting } = useDeleteParent()
  const { mutate: unlink, isPending: unlinking } = useUnlinkParent()
  const archiveAction = useArchiveAction({
    entity: "parent",
    id: parentId,
    listRoute: "/admin/parents",
  })

  if (isLoading) return <DetailSkeleton />
  if (isError) return <DataError message="Impossible de charger la fiche parent." onRetry={() => refetch()} />
  if (!parent) return <DataError message="Parent introuvable." />

  const initials = `${parent.first_name?.[0] ?? ""}${parent.last_name?.[0] ?? ""}`.toUpperCase()
  const fullName = `${parent.last_name} ${parent.first_name}`
  const children = full?.children ?? []
  const summary = full?.summary
  const userEmail = full?.user_email ?? parent.email
  const createdAt = parent.created_at
    ? new Date(parent.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null

  // `null` signifie « vous n'avez pas le droit de lire ce montant » ; `undefined`
  // signifie « pas encore chargé ». Seul le premier justifie de masquer.
  const amountsHidden = summary !== undefined && summary?.total_balance === null

  const kpis: HeroKpi[] = [
    { label: "Enfants", value: summary?.children_count ?? children.length, icon: Users },
    ...(amountsHidden
      ? []
      : [
          { label: "Total payé", value: formatXof(summary?.total_paid ?? 0), icon: Coins },
          {
            label: "Reste à payer",
            value: formatXof(summary?.total_balance ?? 0),
            icon: Wallet,
            hint: summary?.academic_year_name ? `Année ${summary.academic_year_name}` : undefined,
          },
        ]),
  ]

  const handleDelete = () =>
    deleteParent(parentId, { onSuccess: () => router.push("/admin/students" as Route) })

  const confirmUnlink = () => {
    if (!unlinkTarget) return
    unlink(
      { parentId, studentId: unlinkTarget.student_id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["parent", parentId, "full"] })
          setUnlinkTarget(null)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <DetailHero
        onBack={() => router.back()}
        backLabel="Retour à la liste des parents"
        initials={initials}
        name={fullName}
        subtitle={`Parent${children.length > 0 ? ` · ${children.length} enfant${children.length > 1 ? "s" : ""}` : ""}`}
        contact={<ContactActions phone={parent.phone} email={userEmail} variant="hero" />}
        kpis={kpis}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions sur le parent</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier les infos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLinkOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Lier un enfant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Archiver d'abord : c'est le geste réversible, donc celui que
                  l'on veut voir avant la suppression définitive. */}
              {archiveAction.canArchive && (
                <DropdownMenuItem onClick={archiveAction.open}>
                  <Archive className="mr-2 h-4 w-4" />
                  {ARCHIVE_MENU_LABEL.parent}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer le parent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Enfants liés */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Enfants liés
            </h2>
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Lier un enfant
            </button>
          </div>

          {children.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Aucun enfant lié à ce parent.</p>
              <button
                type="button"
                onClick={() => setLinkOpen(true)}
                className="mt-1 text-sm font-medium text-accent"
              >
                Lier un enfant maintenant
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {children.map((child) => (
                <ParentChildCard key={child.student_id} child={child} onUnlink={setUnlinkTarget} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact & compte */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Contact &amp; compte</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={userEmail ?? "Non renseigné"} />
            <InfoItem
              icon={<MapPin className="h-4 w-4" />}
              label="Ville / Commune"
              value={[parent.city, parent.commune].filter(Boolean).join(" / ") || "Non renseigné"}
            />
            <AccountStatusItem
              hasAccount={!!(full?.user_email || parent.user_id)}
              isActive={full?.user_is_active}
              lastLogin={full?.user_last_login}
            />
            <InfoItem icon={<CalendarDays className="h-4 w-4" />} label="Créé le" value={createdAt ?? "—"} />
          </div>
        </CardContent>
      </Card>

      <AccountSection entityType="parent" entityId={parentId} />

      <ParentEditModal parentId={parentId} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Archivage — hors du menu déroulant, qui se démonte à la fermeture */}
      <ArchiveActionDialog action={archiveAction} entity="parent" subject={fullName} />
      <ParentLinkChildModal
        parentId={parentId}
        linkedStudentIds={children.map((c) => c.student_id)}
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
      />

      {/* Unlink confirmation */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(o) => !o && setUnlinkTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cet enfant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le lien entre {fullName} et {unlinkTarget?.student_name} sera retiré. L&apos;élève ne
              sera pas supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnlink}
              disabled={unlinking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinking ? "Retrait..." : "Retirer le lien"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce parent ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le parent {fullName} sera définitivement supprimé. Les
              liens avec les enfants seront retirés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function AccountStatusItem({
  hasAccount,
  isActive,
  lastLogin,
}: {
  hasAccount: boolean
  isActive: boolean | null | undefined
  lastLogin: string | null | undefined
}) {
  let badge: { label: string; className: string; variant: "outline" | "destructive" | "secondary" }
  if (!hasAccount) {
    badge = { label: "Sans compte", className: "", variant: "secondary" }
  } else if (!lastLogin) {
    badge = { label: "En attente", className: "border-amber-500 text-amber-700 dark:text-amber-400", variant: "outline" }
  } else if (isActive === false) {
    badge = { label: "Désactivé", className: "", variant: "destructive" }
  } else {
    badge = { label: "Actif", className: "border-emerald-500 text-emerald-600", variant: "outline" }
  }
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Statut compte</p>
        <Badge variant={badge.variant} className={`text-xs ${badge.className}`}>
          {badge.label}
        </Badge>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-52 rounded-2xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}
