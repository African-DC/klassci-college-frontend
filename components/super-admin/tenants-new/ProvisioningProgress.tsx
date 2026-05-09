"use client"

import type { Route } from "next"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const STAGES = [
  { label: "Création de la base de données", ms: 2500 },
  { label: "Application des migrations", ms: 4500 },
  { label: "Insertion des données initiales", ms: 3000 },
  { label: "Création du compte administrateur", ms: 1500 },
  { label: "Envoi de l'email de bienvenue", ms: 2000 },
]

export function ProvisioningProgress({
  status,
  result,
  errorMessage,
}: {
  status: "pending" | "success" | "error"
  result?: { tenant_slug: string; url: string } | undefined
  errorMessage?: string
}) {
  const [reached, setReached] = useState(0)

  useEffect(() => {
    if (status !== "pending") return
    let i = 0
    let cancelled = false
    const tick = () => {
      if (cancelled || i >= STAGES.length - 1) return
      i++
      setReached(i)
      setTimeout(tick, STAGES[i].ms)
    }
    setTimeout(tick, STAGES[0].ms)
    return () => {
      cancelled = true
    }
  }, [status])

  useEffect(() => {
    if (status === "success") setReached(STAGES.length)
  }, [status])

  return (
    <div className="space-y-6 rounded-md border bg-card p-6">
      <div>
        <h2 className="text-xl font-semibold">
          {status === "pending"
            ? "Provisionnement en cours…"
            : status === "success"
              ? "Tenant provisionné"
              : "Échec du provisioning"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {status === "pending"
            ? "Cela prend généralement 10-30 secondes."
            : status === "success"
              ? `Le tenant ${result?.tenant_slug} est prêt.`
              : "Vérifie les logs et réessaye."}
        </p>
      </div>

      <ul className="space-y-3">
        {STAGES.map((stage, i) => (
          <li key={stage.label} className="flex items-center gap-3">
            {i < reached ? (
              <Check className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : i === reached && status === "pending" ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
            ) : status === "error" && i === reached ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            ) : (
              <span className="h-5 w-5 shrink-0 rounded-full border-2 border-muted" />
            )}
            <span className={i < reached ? "font-medium" : "text-muted-foreground"}>
              {stage.label}
            </span>
          </li>
        ))}
      </ul>

      {status === "error" && errorMessage && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {status === "success" && result && (
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href={`/super-admin/tenants/${result.tenant_slug}` as Route}>
              Ouvrir la fiche
            </Link>
          </Button>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Visiter le site →
          </a>
        </div>
      )}
    </div>
  )
}
