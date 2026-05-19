"use client"

import { useState } from "react"
import { ChevronDown, HeartHandshake, Link2, UserPlus } from "lucide-react"
import { useStudentParents, useUnlinkParent } from "@/lib/hooks/useParents"
import { Button } from "@/components/ui/button"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionCard, StatusPill, EmptyState } from "./_primitives"
import { ParentCard } from "../parents/ParentCard"
import { ParentCreateModal } from "../parents/ParentCreateModal"
import { ParentLinkModal } from "../parents/ParentLinkModal"

interface ParentsTabProps {
  studentId: number
}

type UnlinkTarget = { id: number; name: string } | null
type AddMode = "create" | "link" | null

export function ParentsTab({ studentId }: ParentsTabProps) {
  const {
    data: parents,
    isLoading,
    isError,
    refetch,
  } = useStudentParents(studentId)
  const [unlinkTarget, setUnlinkTarget] = useState<UnlinkTarget>(null)
  const [addMode, setAddMode] = useState<AddMode>(null)
  const { mutate: unlinkParent, isPending: unlinking } = useUnlinkParent()

  const parentList = parents ?? []
  const count = parentList.length

  const handleUnlink = () => {
    if (!unlinkTarget) return
    unlinkParent(
      { parentId: unlinkTarget.id, studentId },
      { onSuccess: () => setUnlinkTarget(null) },
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard
        icon={<HeartHandshake className="h-4 w-4" />}
        title="Famille &amp; tuteurs"
        description={
          count > 0
            ? "Contacts joignables pour les communications école"
            : "Indispensable pour les notifications de paiement, absences et bulletins"
        }
        action={
          <div className="flex items-center gap-2">
            {count > 0 && (
              <StatusPill tone="primary">
                {count} parent{count > 1 ? "s" : ""}
              </StatusPill>
            )}
            <AddParentTrigger onPick={setAddMode} />
          </div>
        }
      >
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : isError ? (
          <ParentsError onRetry={() => refetch()} />
        ) : count === 0 ? (
          <EmptyState
            icon={<HeartHandshake className="h-5 w-5" />}
            title="Aucun parent lié"
            message="Ajoutez le père, la mère ou un tuteur pour activer les notifications école et le portail parent."
            cta={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => setAddMode("create")}
                  className="h-11 gap-1.5"
                  size="sm"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Nouveau parent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAddMode("link")}
                  className="h-11 gap-1.5"
                  size="sm"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Lier un existant
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {parentList.map((parent) => (
              <ParentCard
                key={parent.id}
                parent={parent as Parameters<typeof ParentCard>[0]["parent"]}
                onUnlink={setUnlinkTarget}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Modals */}
      <ParentCreateModal
        studentId={studentId}
        open={addMode === "create"}
        onClose={() => setAddMode(null)}
      />
      <ParentLinkModal
        studentId={studentId}
        open={addMode === "link"}
        onClose={() => setAddMode(null)}
      />

      {/* Confirm unlink */}
      <AlertDialog
        open={!!unlinkTarget}
        onOpenChange={(open) => !open && setUnlinkTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Délier ce parent ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le lien entre <strong>{unlinkTarget?.name}</strong> et l&apos;élève sera retiré.
              Le parent reste dans le système et peut être relié à un autre élève.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 sm:h-10">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlink}
              disabled={unlinking}
              className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:h-10"
            >
              {unlinking ? "Suppression..." : "Délier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AddParentTrigger({ onPick }: { onPick: (mode: AddMode) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-9 gap-1">
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ajouter</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onPick("create")}>
          <UserPlus className="mr-2 h-4 w-4" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">Nouveau parent</span>
            <span className="text-[10px] text-muted-foreground">
              Créer un parent qui n&apos;existe pas
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPick("link")}>
          <Link2 className="mr-2 h-4 w-4" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">Lier un existant</span>
            <span className="text-[10px] text-muted-foreground">
              Rechercher un parent déjà enregistré
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ParentsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/30 px-6 py-8 text-center">
      <p className="text-sm font-medium">Impossible de charger les parents</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Vérifiez la connexion et réessayez. Si le problème persiste, contactez le support.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-1 h-9">
        Réessayer
      </Button>
    </div>
  )
}
