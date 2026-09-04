"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Camera,
  Pencil,
  Smartphone,
  Trash2,
  User,
  Activity,
  MoreVertical,
  Coins,
  UserPlus,
  Clock,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataError } from "@/components/shared/DataError";
import { DetailHero } from "@/components/shared/DetailHero";
import { AccountSection } from "@/components/shared/account/AccountSection";
import { ContactActions } from "@/components/shared/ContactActions";
import {
  ArchiveActionDialog,
  ARCHIVE_MENU_LABEL,
} from "@/components/shared/ArchiveActionDialog";
import { useArchiveAction } from "@/lib/hooks/useArchiveAction";
import type { HeroKpi } from "@/components/shared/PageHero";
import { StaffEditModal } from "./StaffEditModal";
import { StaffProfileTab } from "./tabs/StaffProfileTab";
import { StaffActivityTab } from "./tabs/StaffActivityTab";
import {
  useStaffMember,
  useStaffFull,
  useDeleteStaff,
  staffKeys,
} from "@/lib/hooks/useStaff";
import { staffApi } from "@/lib/api/staff";
import {
  RecordPhotoSurfaces,
  useRecordPhoto,
} from "@/components/shared/upload-handoff/useRecordPhoto";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { staffRoleLabel } from "@/lib/contracts/staff";
import { getUploadUrl } from "@/lib/utils";
import { formatXof } from "@/lib/export/format";

export function StaffDetailClient({ staffId }: { staffId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { has } = usePermissions();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);

  const { data: staff, isLoading, isError, refetch } = useStaffMember(staffId);
  const { data: fullData } = useStaffFull(staffId);
  const { mutate: deleteStaff, isPending: deleting } = useDeleteStaff();
  const archiveAction = useArchiveAction({
    entity: "staff",
    id: staffId,
    listRoute: "/admin/staff",
  });

  // `staffApi.uploadPhoto` n'avait aucun appelant : la fiche montrait la photo
  // sans jamais offrir de la poser. Même entrée que pour l'élève et
  // l'enseignant : import depuis le poste, ou dépôt par téléphone.
  const photo = useRecordPhoto({
    targetKind: "staff_photo",
    subjectId: staffId,
    upload: (file) => staffApi.uploadPhoto(staffId, file),
    onSaved: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  });
  const canEditPhoto = has("admin:staff:update");

  const handleDelete = () =>
    deleteStaff(staffId, { onSuccess: () => router.push("/admin/staff") });

  if (isLoading) return <DetailSkeleton />;
  if (isError)
    return (
      <DataError
        message="Impossible de charger la fiche du personnel."
        onRetry={() => refetch()}
      />
    );
  if (!staff) return <DataError message="Personnel introuvable." />;

  const initials =
    `${staff.first_name?.[0] ?? ""}${staff.last_name?.[0] ?? ""}`.toUpperCase();
  const fullName = `${staff.last_name} ${staff.first_name}`;
  const photoSrc = getUploadUrl(
    (fullData?.photo_url ?? (staff as Record<string, unknown>).photo_url) as
      | string
      | null
      | undefined,
  );
  const activity = fullData?.activity;
  const lastLoginLabel = fullData?.user_last_login
    ? new Date(fullData.user_last_login).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Jamais";

  const kpis: HeroKpi[] = [
    {
      label: "Versements encaissés",
      value: activity?.payments_count ?? 0,
      icon: Coins,
      hint:
        activity && activity.payments_count > 0
          ? formatXof(activity.payments_amount)
          : undefined,
    },
    {
      label: "Inscriptions traitées",
      value: activity?.enrollments_count ?? 0,
      icon: UserPlus,
    },
    { label: "Dernière connexion", value: lastLoginLabel, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <DetailHero
        onBack={() => router.push("/admin/staff")}
        backLabel="Retour à la liste du personnel"
        photoUrl={photoSrc}
        initials={initials}
        name={fullName}
        badge={
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
            {staffRoleLabel(staff.role)}
          </span>
        }
        subtitle={staff.position ?? "Poste non renseigné"}
        contact={
          <ContactActions
            phone={staff.phone}
            email={fullData?.user_email}
            variant="hero"
          />
        }
        kpis={kpis}
        onAvatarClick={() => photoLoaded && setPhotoPreview(true)}
        onPhotoStatus={setPhotoLoaded}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">
                Actions sur le membre du personnel
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier les infos
              </DropdownMenuItem>
              {canEditPhoto && (
                <DropdownMenuItem
                  onClick={photo.pickFile}
                  disabled={photo.busy}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {photoSrc ? "Changer la photo" : "Ajouter une photo"}
                </DropdownMenuItem>
              )}
              {canEditPhoto && photo.phoneOffered && (
                <DropdownMenuItem
                  onClick={photo.usePhone}
                  disabled={photo.busy}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Photo depuis mon téléphone
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {/* Archiver d'abord : c'est le geste réversible, donc celui que
                  l'on veut voir avant la suppression définitive. */}
              {archiveAction.canArchive && (
                <DropdownMenuItem onClick={archiveAction.open}>
                  <Archive className="mr-2 h-4 w-4" />
                  {ARCHIVE_MENU_LABEL.staff}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer le personnel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Hors du menu déroulant : Radix démonte son contenu à la fermeture, et
          l'input comme le dialogue disparaîtraient au clic même qui les ouvre. */}
      <RecordPhotoSurfaces photo={photo} />

      {/* Aperçu de la photo. La poser se fait par le menu, comme partout ailleurs. */}
      {photoSrc && (
        <Dialog open={photoPreview} onOpenChange={setPhotoPreview}>
          <DialogContent className="max-w-md p-2 sm:p-2">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSrc}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="px-2 pb-1 text-sm font-medium">{fullName}</p>
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
          <TabsTrigger value="activite">
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            Activité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <StaffProfileTab staff={staff} fullData={fullData} />
        </TabsContent>
        <TabsContent value="activite">
          <StaffActivityTab fullData={fullData} />
        </TabsContent>
      </Tabs>

      {/* Compte de connexion — information secondaire, placée en bas de fiche */}
      <AccountSection entityType="staff" entityId={staffId} />

      <StaffEditModal
        staffId={staffId}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {/* Archivage — hors du menu déroulant, qui se démonte à la fermeture */}
      <ArchiveActionDialog
        action={archiveAction}
        entity="staff"
        subject={`${fullName} · ${staffRoleLabel(staff.role)}`}
      />

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
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-52 rounded-2xl" />
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
