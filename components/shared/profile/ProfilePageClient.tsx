"use client"

import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Camera, Trash2, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { ProfileInfoCard } from "./ProfileInfoCard"
import { NotificationPrefsCard } from "./NotificationPrefsCard"
import { MyLeaveCard } from "@/components/shared/leave/MyLeaveCard"

const LEAVE_ROLES = ["admin", "director", "teacher", "staff"]
import { useMyProfile, profileKeys } from "@/lib/hooks/useProfile"
import { profileApi } from "@/lib/api/profile"
import { getUploadUrl } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  staff: "Personnel",
  teacher: "Enseignant",
  student: "Élève",
  parent: "Parent",
  super_admin: "Super administrateur",
}

export function ProfilePageClient() {
  const { data: profile, isLoading, isError, refetch } = useMyProfile()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [photoLoaded, setPhotoLoaded] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await profileApi.uploadPhoto(file)
      queryClient.invalidateQueries({ queryKey: profileKeys.me })
      toast.success("Photo mise à jour")
    } catch (err) {
      toast.error("Erreur", { description: err instanceof Error ? err.message : "Envoi impossible" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async () => {
    try {
      await profileApi.deletePhoto()
      queryClient.invalidateQueries({ queryKey: profileKeys.me })
      toast.success("Photo supprimée")
    } catch {
      toast.error("Erreur lors de la suppression de la photo")
    }
  }

  if (isLoading) return <ProfileSkeleton />
  if (isError || !profile)
    return <DataError message="Impossible de charger votre profil." onRetry={() => refetch()} />

  const fullName = `${profile.last_name} ${profile.first_name}`.trim() || profile.email
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "?"
  const photoSrc = getUploadUrl(profile.photo_url)
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role
  const hasPhoto = Boolean(photoSrc && photoLoaded)

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-[linear-gradient(135deg,#0a3d8f_0%,#0453cb_42%,#2a69cb_56%,#f5821f_92%)] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="relative shrink-0">
            <Avatar className="h-24 w-24 rounded-2xl border-2 border-white/25">
              {photoSrc ? (
                <AvatarImage
                  src={photoSrc}
                  alt={fullName}
                  className="object-cover"
                  onLoadingStatusChange={(s) => setPhotoLoaded(s === "loaded")}
                />
              ) : null}
              <AvatarFallback className="rounded-2xl bg-white/15 text-2xl font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {profile.can_edit_photo && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label={hasPhoto ? "Changer la photo" : "Ajouter une photo"}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-accent text-white shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-serif text-2xl font-bold tracking-tight">{fullName}</h1>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                {roleLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-white/75">{profile.email}</p>
            {profile.can_edit_photo && hasPhoto && (
              <button
                type="button"
                onClick={handleDelete}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Retirer la photo
              </button>
            )}
          </div>
        </div>
      </section>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      <ProfileInfoCard profile={profile} />

      {LEAVE_ROLES.includes(profile.role) && <MyLeaveCard />}

      <NotificationPrefsCard />
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  )
}
