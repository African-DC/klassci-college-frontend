"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Users,
  Mail,
  MoreVertical,
  Phone,
  CalendarDays,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { DataError } from "@/components/shared/DataError"
import { useParent, useDeleteParent } from "@/lib/hooks/useParents"
import { parentsApi } from "@/lib/api/parents"
import { ParentEditModal } from "./ParentEditModal"
import type { Route } from "next"

interface ParentDetailClientProps {
  parentId: number
}

export function ParentDetailClient({ parentId }: ParentDetailClientProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const { data: parent, isLoading, isError, refetch } = useParent(parentId)
  const { data: fullData } = useQuery({
    queryKey: ["parent", parentId, "full"],
    queryFn: () => parentsApi.getFull(parentId),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5,
  })
  const { mutate: deleteParent, isPending: deleting } = useDeleteParent()

  const handleDelete = () => {
    deleteParent(parentId, {
      onSuccess: () => {
        router.push("/admin/students" as Route)
      },
    })
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <DataError message="Impossible de charger la fiche parent." onRetry={() => refetch()} />
  if (!parent) return <DataError message="Parent introuvable." />

  const initials = `${parent.first_name?.[0] ?? ""}${parent.last_name?.[0] ?? ""}`.toUpperCase()
  const fullName = `${parent.last_name} ${parent.first_name}`
  const children = (fullData?.children as Array<Record<string, unknown>>) ?? []
  const userEmail = (fullData?.user_email as string | null | undefined) ?? parent.email
  const userIsActive = fullData?.user_is_active as boolean | null | undefined
  const userLastLogin = fullData?.user_last_login as string | null | undefined
  const createdAt = parent.created_at
    ? new Date(parent.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null

  return (
    <div className="space-y-6">
      {/* Header — pattern cristallisé redesign-premium principes 13/14 */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Retour"
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <Avatar className="h-16 w-16 shrink-0 rounded-2xl border-2 border-border sm:h-24 sm:w-24">
          <AvatarFallback className="rounded-2xl bg-primary/10 text-xl font-semibold text-primary sm:text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-lg tracking-tight sm:text-2xl">{fullName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Parent {children.length > 0 ? `· ${children.length} enfant${children.length > 1 ? "s" : ""}` : ""}
          </p>
          {parent.phone && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a
                href={`tel:${parent.phone}`}
                className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/5"
              >
                <Phone className="h-3 w-3" />
                {parent.phone}
              </a>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions sur le parent</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer le parent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Section Enfants liés — Wave-style 1-tap action vers la fiche élève */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Enfants liés
            </h3>
            {children.length > 0 && (
              <span className="text-xs text-muted-foreground">{children.length} liés</span>
            )}
          </div>
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun enfant lié à ce parent.</p>
          ) : (
            <ul className="space-y-2">
              {children.map((child) => {
                const ln = String(child.last_name ?? "")
                const fn = String(child.first_name ?? "")
                const className = (child.class_name as string | null) ?? null
                const cid = child.id as number
                const ci = `${ln[0] ?? ""}${fn[0] ?? ""}`.toUpperCase()
                return (
                  <li key={cid}>
                    <Link
                      href={`/admin/students/${cid}` as Route}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-muted/50 hover:ring-1 hover:ring-primary transition-all"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {ci}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{ln} {fn}</p>
                        {className && <p className="text-xs text-muted-foreground">{className}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Section Contact & compte — tri-état badge principe 14 */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Contact &amp; compte
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={userEmail ?? "Non renseigné"}
            />
            <InfoItem
              icon={<User className="h-4 w-4" />}
              label="Ville / Commune"
              value={[parent.city, parent.commune].filter(Boolean).join(" / ") || "Non renseigné"}
            />
            <AccountStatusItem isActive={userIsActive} lastLogin={userLastLogin} />
            <InfoItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Créé le"
              value={createdAt ?? "—"}
            />
          </div>
        </CardContent>
      </Card>

      <ParentEditModal
        parentId={parentId}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce parent ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le parent {fullName} sera définitivement supprimé.
              Les liens avec les enfants seront retirés.
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

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
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
  isActive,
  lastLogin,
}: {
  isActive: boolean | null | undefined
  lastLogin: string | null | undefined
}) {
  // Tri-état sémantique principe 14 redesign-premium.
  let badge: { label: string; className: string; variant: "outline" | "destructive" }
  if (!lastLogin) {
    badge = {
      label: "En attente",
      className: "border-amber-500 text-amber-700 dark:text-amber-400",
      variant: "outline",
    }
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
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-16 w-16 rounded-2xl sm:h-24 sm:w-24" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </div>
  )
}
