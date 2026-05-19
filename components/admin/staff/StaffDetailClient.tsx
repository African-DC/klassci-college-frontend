"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Camera, Pencil, Trash2, User, MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useStaffMember, useStaffFull, useDeleteStaff, staffKeys } from "@/lib/hooks/useStaff"
import { staffApi } from "@/lib/api/staff"
import { getUploadUrl } from "@/lib/utils"

// ---------- Main component ----------
interface StaffDetailClientProps {
  staffId: number
}

export function StaffDetailClient({ staffId }: StaffDetailClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoLoaded, setPhotoLoaded] = useState(false)

  const { data: staff, isLoading, isError, refetch } = useStaffMember(staffId)
  const { data: fullData } = useStaffFull(staffId)
  const { mutate: deleteStaff, isPending: deleting } = useDeleteStaff()

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await staffApi.uploadPhoto(staffId, file)
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
      toast.success("Photo mise à jour")
    } catch {
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeletePhoto = async () => {
    try {
      await staffApi.deletePhoto(staffId)
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
      setPhotoPreview(false)
      toast.success("Photo supprimée")
    } catch {
      toast.error("Erreur lors de la suppression de la photo")
    }
  }

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
  const photoSrc = getUploadUrl((staff as Record<string, unknown>).photo_url as string | null | undefined)

  return (
    <div className="space-y-6">
      {/* Header — pattern cristallisé redesign-premium principes 13 + 14 */}
      <div className="flex items-start gap-3">
        <Link
          href="/admin/staff"
          aria-label="Retour à la liste du personnel"
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={() => photoLoaded && setPhotoPreview(true)}
          aria-label={photoLoaded ? "Voir la photo en grand" : "Photo du personnel"}
          className="shrink-0 overflow-hidden rounded-2xl border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-default"
          disabled={!photoLoaded}
        >
          <Avatar className="h-16 w-16 rounded-2xl sm:h-24 sm:w-24">
            {photoSrc ? (
              <AvatarImage
                src={photoSrc}
                alt={fullName}
                className="object-cover"
                onLoadingStatusChange={(status) => setPhotoLoaded(status === "loaded")}
              />
            ) : null}
            <AvatarFallback className="rounded-2xl bg-primary/10 text-xl font-semibold text-primary sm:text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-lg tracking-tight sm:text-2xl">{fullName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {staff.position ?? "Personnel"}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions sur le membre du personnel</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier les infos
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="mr-2 h-4 w-4" />
              {photoSrc ? "Changer la photo" : "Ajouter une photo"}
            </DropdownMenuItem>
            {photoSrc && photoLoaded && (
              <DropdownMenuItem onClick={handleDeletePhoto}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer la photo
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer le personnel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
      </div>

      {/* Photo preview dialog */}
      {photoSrc && (
        <Dialog open={photoPreview} onOpenChange={setPhotoPreview}>
          <DialogContent className="max-w-md p-2">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <img
                src={photoSrc}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-sm font-medium">{fullName}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhotoPreview(false)
                    fileInputRef.current?.click()
                  }}
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5" />
                  Changer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeletePhoto}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Supprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
        <Skeleton className="h-28 w-28 rounded-2xl" />
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
