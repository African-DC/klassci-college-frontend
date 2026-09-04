"use client"

import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  FilePlus,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  Loader2,
  Upload,
} from "lucide-react"
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
import { ComboboxCreate } from "@/components/shared/ComboboxCreate"
import { UploadHandoffButton } from "@/components/shared/upload-handoff/UploadHandoffButton"
import { SectionCard, EmptyState } from "../tabs/_primitives"
import {
  attachmentKeys,
  useDocumentTypes,
  useStudentDocuments,
  useUploadStudentDocument,
  useDeleteStudentDocument,
} from "@/lib/hooks/useStudentAttachments"
import { getUploadUrl } from "@/lib/utils"

export function StudentAttachmentsSection({ studentId }: { studentId: number }) {
  const queryClient = useQueryClient()
  const { data: types } = useDocumentTypes()
  const { data: docs, isLoading } = useStudentDocuments(studentId)
  const { mutate: upload, isPending: uploading } = useUploadStudentDocument(studentId)
  const { mutate: remove, isPending: removing } = useDeleteStudentDocument(studentId)

  const fileRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const canSubmit = Boolean(docType.trim()) && Boolean(file) && !uploading

  // Le type de document est choisi ICI, sur l'ordinateur, jamais sur le
  // téléphone : l'écran qui sait ce qu'on classe est celui de l'opérateur, et
  // le téléphone n'a pas à en apprendre davantage. Le serveur l'exige à
  // l'OUVERTURE de la session : découvrir le manque une fois la photo prise
  // reviendrait à la refuser, l'élève déjà reparti.
  const typeChoisi = docType.trim()

  const submit = () => {
    if (!file || !docType.trim()) return
    upload(
      { file, documentType: docType.trim() },
      {
        onSuccess: () => {
          setFile(null)
          setDocType("")
          if (fileRef.current) fileRef.current.value = ""
        },
      },
    )
  }

  return (
    <SectionCard
      icon={<FilePlus className="h-4 w-4" />}
      title="Pièces jointes"
      description="Acte de naissance, certificat médical, autres documents fournis"
    >
      {/* Formulaire d'ajout */}
      <div className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Type de document</p>
            <ComboboxCreate
              options={(types ?? []).map((t) => t.name)}
              value={docType}
              onChange={setDocType}
              placeholder="Choisir ou créer un type"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Fichier (PDF ou image)</p>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-start font-normal"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{file ? file.name : "Choisir un fichier"}</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button className="h-11 w-full sm:w-auto" disabled={!canSubmit} onClick={submit}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi…
              </>
            ) : (
              <>
                <FilePlus className="mr-2 h-4 w-4" />
                Ajouter le document
              </>
            )}
          </Button>
          {/*
            La seule cible qui accepte le PDF, et la seule qui exige un
            complément : sans type de document choisi, le serveur refuserait
            l'ouverture — le bouton reste donc fermé jusque-là.
          */}
          <UploadHandoffButton
            targetKind="student_document"
            subjectId={studentId}
            extras={{ document_type: typeChoisi }}
            label="Photographier le document"
            disabled={!typeChoisi || uploading}
            onResolved={() => {
              setFile(null)
              setDocType("")
              if (fileRef.current) fileRef.current.value = ""
              void queryClient.invalidateQueries({
                queryKey: attachmentKeys.list(studentId),
              })
              void queryClient.invalidateQueries({
                queryKey: attachmentKeys.types,
              })
              toast.success("Document ajouté")
            }}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Documents ajoutés — séparés du formulaire d'ajout */}
      <div className="space-y-2 border-t pt-4">
        <p className="text-sm font-semibold">
          Documents ajoutés{docs && docs.length > 0 ? ` (${docs.length})` : ""}
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !docs || docs.length === 0 ? (
          <EmptyState
            icon={<FilePlus className="h-5 w-5" />}
            title="Aucune pièce jointe"
            message="Ajoutez l'extrait de naissance, un certificat médical ou tout autre document via le formulaire ci-dessus."
          />
        ) : (
          <div className="space-y-2">
            {docs.map((d) => {
              const isPdf = d.mime_type === "application/pdf"
              const Icon = isPdf ? FileText : ImageIcon
              const url = getUploadUrl(d.file_url) ?? d.file_url
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.document_type}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.file_name ? `${d.file_name} · ` : ""}
                      {new Date(d.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                    aria-label={`Aperçu de ${d.document_type}`}
                    title="Aperçu"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <a
                    href={url}
                    download={d.file_name ?? undefined}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Télécharger ${d.document_type}`}
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(d.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                    aria-label={`Supprimer ${d.document_type}`}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le document sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget !== null) remove(deleteTarget)
                setDeleteTarget(null)
              }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  )
}
