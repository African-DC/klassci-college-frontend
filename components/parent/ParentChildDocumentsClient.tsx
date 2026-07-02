"use client"

import { useState } from "react"
import { ArrowLeft, Award, FileCheck2, Loader2, Clock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PdfPreviewButton } from "@/components/shared/PdfPreviewButton"
import { studentDocumentsApi } from "@/lib/api/student-documents"
import { downloadBlob } from "@/lib/utils"
import { useParentChildren } from "@/lib/hooks/useParentPortal"
import { isEnrolledFromClassName } from "@/lib/utils/enrollment-status"

interface ParentChildDocumentsClientProps {
  childId: number
}

type DocKind = "certificate" | "attendance"

const DOCS: {
  kind: DocKind
  title: string
  description: string
  icon: typeof Award
  download: (id: number) => Promise<Blob>
  filenameBase: string
}[] = [
  {
    kind: "certificate",
    title: "Certificat de scolarité",
    description:
      "Atteste que votre enfant est régulièrement inscrit cette année. Utile pour une banque, une bourse ou un transfert d'établissement.",
    icon: Award,
    download: studentDocumentsApi.downloadCertificateScolarite,
    filenameBase: "certificat_scolarite",
  },
  {
    kind: "attendance",
    title: "Attestation de fréquentation",
    description:
      "Présente le taux de présence de votre enfant cette année avec le détail des présences, retards et absences.",
    icon: FileCheck2,
    download: studentDocumentsApi.downloadAttestationFrequentation,
    filenameBase: "attestation_frequentation",
  },
]

export function ParentChildDocumentsClient({
  childId,
}: ParentChildDocumentsClientProps) {
  const [downloading, setDownloading] = useState<DocKind | null>(null)
  const { data: children } = useParentChildren()
  const child = children?.find((c) => c.id === childId)
  // Documents officiels (certificat/attestation) ne sont émis que pour les
  // élèves dont l'inscription est validée pour l'année courante. Si on tente
  // de télécharger sur un enfant pas inscrit, le BE répond une erreur peu
  // exploitable. On affiche un guard explicite pour Mme Aïcha avant le clic.
  const isEnrolled = child ? isEnrolledFromClassName(child.class_name) : true
  // isEnrolled est initialisé à `true` tant que children n'est pas chargé
  // pour ne pas masquer l'UI pendant le fetch initial — le guard apparaît
  // une fois la donnée arrivée si pertinent.

  async function handleDownload(doc: (typeof DOCS)[number]) {
    setDownloading(doc.kind)
    try {
      const blob = await doc.download(childId)
      downloadBlob(blob, `${doc.filenameBase}_enfant_${childId}.pdf`)
      toast.success(`${doc.title} téléchargé(e)`)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du téléchargement"
      toast.error(message)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/parent/children"
          className="flex h-11 w-11 items-center justify-center rounded-lg border hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Documents officiels</h1>
          <p className="text-sm text-muted-foreground">
            Téléchargez les documents administratifs de votre enfant.
          </p>
        </div>
      </div>

      {!isEnrolled && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 py-4">
            <Clock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900">
                Documents indisponibles pour le moment
              </p>
              <p className="text-xs text-amber-800">
                Les documents officiels (certificat de scolarité, attestation de
                fréquentation) sont délivrés uniquement pour les élèves dont
                l&apos;inscription est validée pour l&apos;année courante. Contactez le
                secrétariat pour finaliser le dossier.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {DOCS.map((doc) => {
          const Icon = doc.icon
          const isDownloading = downloading === doc.kind
          const disabled = isDownloading || !isEnrolled
          return (
            <div
              key={doc.kind}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium">{doc.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {doc.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <PdfPreviewButton
                  fetchBlob={() => doc.download(childId)}
                  label={doc.title}
                  disabled={disabled}
                  className="h-11 w-full sm:flex-1"
                />
                <Button
                  size="lg"
                  onClick={() => handleDownload(doc)}
                  disabled={disabled}
                  aria-disabled={disabled}
                  aria-label={`Télécharger ${doc.title}`}
                  className="h-11 w-full sm:flex-1"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : !isEnrolled ? (
                    "Disponible après inscription"
                  ) : (
                    "Télécharger PDF"
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
