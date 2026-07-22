"use client"

import { useState, type FormEvent } from "react"
import { Loader2, ScanLine, ShieldQuestion } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { verifyDocumentByCode, type VerifyResult } from "@/lib/api/verify"
import type { TenantSlugResolution } from "@/lib/utils/tenant-slug"
import {
  NotRecognizedView,
  RecognizedDocumentView,
  VerificationUnavailableView,
} from "./result-views"

type Props = {
  tenantResolution: TenantSlugResolution
}

export function ManualVerifier({ tenantResolution }: Props) {
  if (tenantResolution.status !== "valid") {
    return <TenantResolutionError status={tenantResolution.status} />
  }

  return <ManualVerifierForm tenant={tenantResolution.tenant} />
}

function TenantResolutionError({ status }: { status: "missing" | "invalid" }) {
  const isMissing = status === "missing"

  return (
    <Card>
      <CardContent className="space-y-3 p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldQuestion className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold">
          {isMissing ? "Établissement requis" : "Établissement invalide"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isMissing
            ? "Ce lien de vérification ne précise pas l'établissement concerné."
            : "Ce lien de vérification contient un identifiant d'établissement invalide."}
        </p>
      </CardContent>
    </Card>
  )
}

function ManualVerifierForm({ tenant }: { tenant: string }) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const normalized = code.trim().toUpperCase()
    if (!normalized) return

    setLoading(true)
    setResult(null)
    try {
      const res = await verifyDocumentByCode(tenant, normalized)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-3 bg-primary px-6 py-7 text-center text-primary-foreground">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
            <ShieldQuestion className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight">Vérifier un document</h1>
            <p className="text-sm text-primary-foreground/85">
              Saisissez le code de vérification figurant sur le document
            </p>
          </div>
        </div>

        <CardContent className="space-y-4 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="seal-code" className="text-sm font-medium text-foreground">
                Code de vérification
              </label>
              <Input
                id="seal-code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SNI-XXXX-XXXX-XXXX-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={loading}
                className="h-11 font-mono tracking-wide"
                aria-describedby="seal-help"
              />
              <p id="seal-help" className="text-xs text-muted-foreground">
                Le code se trouve sous le Sceau numérique institutionnel KLASSCI.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || code.trim().length === 0}
              className="h-11 w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Vérification...
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4" aria-hidden="true" />
                  Vérifier
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result?.status === "recognized" ? (
        <RecognizedDocumentView doc={result.document} tenant={tenant} sealCode={code.trim()} />
      ) : null}
      {result?.status === "not_found" ? <NotRecognizedView /> : null}
      {result?.status === "unavailable" ? <VerificationUnavailableView /> : null}
    </div>
  )
}
