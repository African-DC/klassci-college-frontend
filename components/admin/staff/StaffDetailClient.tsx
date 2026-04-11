"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, Trash2, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { StaffEditModal } from "./StaffEditModal"
import { StaffProfileTab } from "./tabs/StaffProfileTab"
import { useStaffMember, useStaffFull, useDeleteStaff } from "@/lib/hooks/useStaff"

// ---------- Main component ----------
interface StaffDetailClientProps {
  staffId: number
}

export function StaffDetailClient({ staffId }: StaffDetailClientProps) {
  const router = useRouter()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: staff, isLoading, isError, refetch } = useStaffMember(staffId)
  const { data: fullData } = useStaffFull(staffId)
  const { mutate: deleteStaff, isPending: deleting } = useDeleteStaff()

  const handleDelete = () => {
    deleteStaff(staffId, {
      onSuccess: () => {
        router.push("/admin/staff")
      },
    })
  }

  if (isLoading) return <DetailSkeleton />
  if (isError)
    return (
      <DataError
        message="Impossible de charger la fiche du personnel."
        onRetry={() => refetch()}
      />
    )
  if (!staff) return <DataError message="Personnel introuvable." />

  const initials =
    `${staff.first_name?.[0] ?? ""}${staff.last_name?.[0] ?? ""}`.toUpperCase()
  const fullName = `${staff.last_name} ${staff.first_name}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/staff"
            aria-label="Retour à la liste du personnel"
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <Avatar className="h-20 w-20 text-2xl">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h1 className="font-serif text-2xl tracking-tight">{fullName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {staff.position ?? "Personnel"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profil" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profil">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Profil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <StaffProfileTab staff={staff} fullData={fullData} />
        </TabsContent>
      </Tabs>

      {/* Edit modal */}
      <StaffEditModal
        staffId={staffId}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer ce membre du personnel ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. {fullName} sera définitivement
              supprimé.
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

// ---------- Skeleton ----------
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-10 w-40 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
