"use client"

import { useState } from "react"
import { Award, FileCheck2, FileText, Loader2, Download, Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PdfPreviewButton } from "@/components/shared/PdfPreviewButton"
import { StudentAttachmentsSection } from "../attachments/StudentAttachmentsSection"
import { studentDocumentsApi } from "@/lib/api/student-documents"
import { downloadBlob } from "@/lib/utils"
import { SectionCard, StatusPill } from "./_primitives"
import { DocumentLockNotice } from "@/components/shared/documents/DocumentLockNotice"
import { DocumentOverrideDialog } from "@/components/shared/documents/DocumentOverrideDialog"
import { useDocumentReleaseStatus } from "@/lib/hooks/useDocumentRelease"
import { asDocumentBlocked } from "@/lib/contracts/document-release"

interface DocumentsTabProps {
  studentId: number
  studentLastName?: string
}

type DocKind = "certificate" | "attendance"

const DOCS: {
  kind: DocKind
  title: string
  description: string
  icon: typeof Award
  download: (id: number, overrideReason?: string) => Promise<Blob>
  filenameBase: string
  tone: "primary" | "accent"
}[] = [
  {
    kind: "certificate",
    title: "Certificat de scolarité",
    description: "Atteste l'inscription régulière de l'élève. Document officiel signé par le chef d'établissement.",
    icon: Award,
    download: studentDocumentsApi.downloadCertificateScolarite,
    filenameBase: "certificat_scolarite",
    tone: "primary",
  },
  {
    kind: "attendance",
    title: "Attestation de fréquentation",
    description: "Récapitule les présences de l'élève sur l'année courante avec son taux de fréquentation.",
    icon: FileCheck2,
    download: studentDocumentsApi.downloadAttestationFrequentation,
    filenameBase: "attestation_frequentation",
    tone: "accent",
  },
]

export function DocumentsTab({ studentId, studentLastName }: DocumentsTabProps) {
  const [downloading, setDownloading] = useState<DocKind | null>(null)
  const [overrideTarget, setOverrideTarget] = useState<(typeof DOCS)[number] | null>(null)

  // Retenue pour impayé, interrogée avant d'afficher les boutons. `can_override`
  // vient de la permission `documents:release:override` : la direction peut
  // délivrer malgré la dette, le secrétariat non.
  const { data: release, refetch: refetchRelease } = useDocumentReleaseStatus(studentId)
  const isBlocked = release?.blocked ?? false
  const canOverride = release?.can_override ?? false

  async function runDownload(doc: (typeof DOCS)[number], overrideReason?: string) {
    setDownloading(doc.kind)
    try {
      const blob = await doc.download(studentId, overrideReason)
      const safeName = (studentLastName ?? `eleve_${studentId}`)
        .toUpperCase()
        .replace(/\s+/g, "_")
      downloadBlob(blob, `${doc.filenameBase}_${safeName}.pdf`)
      toast.success(
        overrideReason
          ? `${doc.title} délivré par dérogation — la décision est journalisée`
          : `${doc.title} téléchargé`,
      )
      setOverrideTarget(null)
    } catch (err) {
      // L'état de retenue est mis en cache : un versement encaissé entre-temps
      // le rend faux dans les deux sens. Si le backend refuse, on resynchronise
      // pour que le bandeau annonce le vrai montant.
      if (asDocumentBlocked(err)) void refetchRelease()
      const message = err instanceof Error ? err.message : "Erreur lors du téléchargement"
      toast.error(message)
    } finally {
      setDownloading(null)
    }
  }

  function handleDownload(doc: (typeof DOCS)[number]) {
    // Retenu et on peut déroger : on demande le motif avant de générer quoi
    // que ce soit, plutôt que de laisser le backend refuser puis rejouer.
    if (isBlocked && canOverride) {
      setOverrideTarget(doc)
      return
    }
    void runDownload(doc)
  }

  return (
    <div className="space-y-4">
      <SectionCard
        icon={<FileText className="h-4 w-4" />}
        title="Documents officiels"
        description="Génération à la demande, signés par le chef d'établissement"
        action={
          isBlocked ? (
            <StatusPill tone="warning">
              <Lock className="h-3 w-3" />
              Retenus
            </StatusPill>
          ) : (
            <StatusPill tone="success">
              <FileCheck2 className="h-3 w-3" />
              Disponibles
            </StatusPill>
          )
        }
      >
        {isBlocked && release ? (
          <div className="mb-4">
            <DocumentLockNotice lateAmount={release.late_amount} canOverride={canOverride} />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {DOCS.map((doc) => {
            const Icon = doc.icon
            const isDownloading = downloading === doc.kind
            const iconBg = doc.tone === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-[rgba(245,130,32,0.12)] text-[#F58220]"
            return (
              <div
                key={doc.kind}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className={`absolute right-3 top-3 h-1 w-12 rounded-full ${doc.tone === "primary" ? "bg-primary/30" : "bg-[#F58220]/40"}`} aria-hidden />

                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-base leading-tight">{doc.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">PDF officiel · 1 page</p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">{doc.description}</p>

                <div className="flex gap-2">
                  <PdfPreviewButton
                    fetchBlob={() => doc.download(studentId)}
                    label={doc.title}
                    size="sm"
                    disabled={isBlocked}
                    className="h-11 flex-1 sm:h-10"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc)}
                    disabled={isDownloading || (isBlocked && !canOverride)}
                    aria-label={`Télécharger ${doc.title}`}
                    className="h-11 flex-1 gap-2 sm:h-10"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Génération…
                      </>
                    ) : isBlocked ? (
                      <>
                        <Lock className="h-4 w-4" />
                        {canOverride ? "Déroger" : "Retenu"}
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Télécharger
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <StudentAttachmentsSection studentId={studentId} />

      <DocumentOverrideDialog
        open={overrideTarget !== null}
        onOpenChange={(open) => {
          if (!open) setOverrideTarget(null)
        }}
        documentLabel={overrideTarget?.title ?? "Le document"}
        lateAmount={release?.late_amount ?? 0}
        pending={downloading !== null}
        onConfirm={(reason) => {
          if (overrideTarget) void runDownload(overrideTarget, reason)
        }}
      />
    </div>
  )
}
