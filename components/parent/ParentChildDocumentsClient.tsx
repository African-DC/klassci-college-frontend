"use client"

import { useState } from "react"
import { ArrowLeft, Award, FileCheck2, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { studentDocumentsApi } from "@/lib/api/student-documents"
import { downloadBlob } from "@/lib/utils"

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

      <div className="space-y-3">
        {DOCS.map((doc) => {
          const Icon = doc.icon
          const isDownloading = downloading === doc.kind
          return (
            <div
              key={doc.kind}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium">{doc.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {doc.description}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => handleDownload(doc)}
                disabled={isDownloading}
                className="h-11 w-full"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  "Télécharger PDF"
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
