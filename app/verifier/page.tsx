"use client"

import { useState, type FormEvent } from "react"
import { Loader2, ScanLine, ShieldQuestion } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { verifyDocumentByCode, type VerifyResult } from "@/lib/api/verify"
import { AuthenticView, NotRecognizedView } from "./_components/result-views"

// Démo mono-tenant : le tenant est fixé à "local". En multi-tenant, il viendrait
// du sous-domaine / du host (ex: lycee-saint-augustin.klassci.com → "lycee-saint-augustin").
const TENANT = "local"

// Le noindex est porté par le layout (app/verifier/layout.tsx), ce qui couvre
// cette page cliente sans casser le SSR.

export default function VerifierByCodePage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Normalise le code saisi (espaces + casse). Le BE gère déjà la
    // normalisation des tirets et du préfixe, donc on envoie tel quel.
    const normalized = code.trim().toUpperCase()
    if (!normalized) return

    setLoading(true)
    setResult(null)
    try {
      const res = await verifyDocumentByCode(TENANT, normalized)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        {/* En-tête bleu KLASSCI : on vérifie une identité, pas un statut. */}
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
              <label htmlFor="cev-code" className="text-sm font-medium text-foreground">
                Code de vérification
              </label>
              <Input
                id="cev-code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CEV-XXXX-XXXX-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={loading}
                className="h-11 font-mono tracking-wide"
                aria-describedby="cev-help"
              />
              <p id="cev-help" className="text-xs text-muted-foreground">
                Le code se trouve au dos du document, sous le cachet de l&apos;établissement.
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

      {/* Résultat affiché sous le formulaire. */}
      {result?.status === "valid" ? <AuthenticView doc={result.document} /> : null}
      {result?.status === "not_found" ? <NotRecognizedView /> : null}
    </div>
  )
}
