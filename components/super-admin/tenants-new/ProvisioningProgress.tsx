"use client"

import type { Route } from "next"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { tenantUrl } from "@/lib/super-admin/tenant-display"

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
  result?: { tenant_slug: string } | undefined
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

      <ul
        role="list"
        aria-label="Étapes du provisionnement"
        aria-live="polite"
        className="space-y-3"
      >
        {STAGES.map((stage, i) => {
          const stageStatus =
            i < reached
              ? "complete"
              : i === reached && status === "pending"
                ? "in-progress"
                : status === "error" && i === reached
                  ? "error"
                  : "pending"
          return (
            <li key={stage.label} className="flex items-center gap-3">
              {stageStatus === "complete" && (
                <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-600" />
              )}
              {stageStatus === "in-progress" && (
                <Loader2 aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin text-primary" />
              )}
              {stageStatus === "error" && (
                <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-destructive" />
              )}
              {stageStatus === "pending" && (
                <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-full border-2 border-muted" />
              )}
              <span className={i < reached ? "font-medium" : "text-muted-foreground"}>
                {stage.label}
              </span>
              <span className="sr-only">
                {stageStatus === "complete"
                  ? " — terminé"
                  : stageStatus === "in-progress"
                    ? " — en cours"
                    : stageStatus === "error"
                      ? " — échec"
                      : " — en attente"}
              </span>
            </li>
          )
        })}
      </ul>

      {status === "error" && errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
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
            href={tenantUrl(result.tenant_slug)}
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
