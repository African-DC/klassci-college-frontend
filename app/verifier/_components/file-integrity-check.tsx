"use client"

import { useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, FileCheck2, Loader2, ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { verifyDocumentFile, type FileVerificationResult } from "@/lib/api/verify"

type Props = {
  tenant: string
  token?: string
  sealCode?: string
}

export function FileIntegrityCheck({ tenant, token, sealCode }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FileVerificationResult | null>(null)
  const [failed, setFailed] = useState(false)
  const requestId = useRef(0)

  async function verifyFile() {
    if (!file || (!token && !sealCode)) return
    const currentRequest = ++requestId.current
    setLoading(true)
    setResult(null)
    setFailed(false)
    const verification = await verifyDocumentFile(
      tenant,
      file,
      token ? { token } : { sealCode: sealCode! },
    )
    if (currentRequest === requestId.current) {
      setResult(verification)
      setFailed(verification === null)
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3 border-t pt-5" aria-labelledby="file-integrity-title">
      <div className="space-y-1">
        <h2 id="file-integrity-title" className="flex items-center gap-2 text-sm font-semibold">
          <FileCheck2 className="h-4 w-4 text-primary" aria-hidden="true" />
          Vérifier le fichier PDF
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Sélectionnez le PDF original pour comparer son empreinte au document scellé.
        </p>
      </div>
      <Input
        type="file"
        accept="application/pdf,.pdf"
        disabled={loading}
        className="h-11 cursor-pointer"
        onChange={(event) => {
          requestId.current += 1
          setFile(event.target.files?.[0] ?? null)
          setResult(null)
          setFailed(false)
          setLoading(false)
        }}
      />
      <Button type="button" className="h-11 w-full" disabled={!file || loading} onClick={verifyFile}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Comparer l&apos;empreinte
      </Button>
      <div aria-live="polite">
        {result?.status === "unavailable" ? (
          <p className="flex items-start gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            La comparaison du fichier n&apos;est pas disponible pour cet ancien sceau.
          </p>
        ) : null}
        {result?.status === "matching" && result.document_status === "active" ? (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Empreinte identique, ce fichier n&apos;a pas été modifié.
          </p>
        ) : null}
        {result?.status === "matching" && result.document_status !== "active" ? (
          <p className="flex items-start gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            L&apos;empreinte est identique, mais ce sceau est {statusLabel(result.document_status)}.
          </p>
        ) : null}
        {result?.status === "modified" ? (
          <p className="flex items-center gap-2 text-sm font-medium text-destructive">
            <ShieldX className="h-4 w-4" aria-hidden="true" />
            Empreinte différente, ce fichier est modifié ou ne correspond pas au sceau.
          </p>
        ) : null}
        {failed ? (
          <p className="text-sm text-destructive">La vérification est momentanément indisponible.</p>
        ) : null}
      </div>
    </section>
  )
}

function statusLabel(status: FileVerificationResult["document_status"]): string {
  if (status === "revoked") return "révoqué"
  if (status === "superseded") return "remplacé par une version plus récente"
  if (status === "expired") return "expiré"
  return "actif"
}
