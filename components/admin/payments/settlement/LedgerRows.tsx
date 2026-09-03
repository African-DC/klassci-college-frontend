"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CategoryLedger, LedgerRow, LedgerStatus } from "@/lib/contracts/fee-category-ledger"

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} F`

/**
 * L'état d'une ligne : son mot, sa lettre, sa couleur.
 *
 * La lettre n'est pas décorative. Le document se lit en plein soleil sur un
 * écran d'entrée de gamme, et un daltonien ne distingue pas l'ambre du vert :
 * la couleur ne porte jamais l'information toute seule.
 */
const ETATS: Record<LedgerStatus, { label: string; mark: string; tone: string }> = {
  paid: {
    label: "Soldé",
    mark: "S",
    tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  partial: {
    label: "Partiel",
    mark: "P",
    tone: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  pending: {
    label: "Dû",
    mark: "D",
    tone: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  in_kind: {
    label: "En nature",
    mark: "N",
    tone: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  waived: {
    label: "Exonéré",
    mark: "E",
    tone: "border-border bg-muted text-muted-foreground",
  },
}

function Etat({ statut }: { statut: LedgerStatus }) {
  const e = ETATS[statut]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-tight",
        e.tone,
      )}
    >
      <span aria-hidden className="font-bold">
        {e.mark}
      </span>
      {e.label}
    </span>
  )
}

function jour(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fr-FR")
}

/** Le reste dû, ou son absence assumée. */
function Reste({ ligne, consolide }: { ligne: LedgerRow; consolide: boolean }) {
  if (!consolide) {
    return (
      <span className="text-muted-foreground" title="Votre caisse seule ne permet pas de le savoir">
        —
      </span>
    )
  }
  if (ligne.remaining === null || ligne.remaining === 0) {
    return <span className="text-muted-foreground">—</span>
  }
  return <span className="font-medium tabular-nums">{fmt(ligne.remaining)}</span>
}

export function LedgerTable({ ledger }: { ledger: CategoryLedger }) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium">Élève</th>
                <th className="px-3 py-2.5 text-left font-medium">Classe</th>
                <th className="px-3 py-2.5 text-left font-medium">État</th>
                <th className="px-3 py-2.5 text-right font-medium">Entré</th>
                <th className="px-3 py-2.5 text-right font-medium">Reste</th>
                {ledger.accepts_in_kind && (
                  <th className="px-3 py-2.5 text-left font-medium">Déposé le</th>
                )}
              </tr>
            </thead>
            <tbody>
              {ledger.lignes.map((l) => (
                <tr key={l.enrollment_id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <span className="font-medium">
                      {l.last_name} {l.first_name}
                    </span>
                    {l.student_matricule ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {l.student_matricule}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{l.class_name || "—"}</td>
                  <td className="px-3 py-2.5">
                    <Etat statut={l.status} />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {l.paid > 0 ? fmt(l.paid) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Reste ligne={l} consolide={ledger.consolide} />
                  </td>
                  {ledger.accepts_in_kind && (
                    <td className="px-3 py-2.5 text-muted-foreground">{jour(l.deposited_at)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Un élève par carte sur téléphone.
 *
 * Six colonnes à faire défiler de côté sur 5,5 pouces, c'est six occasions de
 * perdre la ligne qu'on lisait — et ce document se consulte au guichet.
 */
export function LedgerCards({ ledger }: { ledger: CategoryLedger }) {
  return (
    <div className="space-y-2">
      {ledger.lignes.map((l) => (
        <Card key={l.enrollment_id} className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {l.last_name} {l.first_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {l.class_name || "—"}
                  {l.student_matricule ? ` · ${l.student_matricule}` : ""}
                </p>
              </div>
              <Etat statut={l.status} />
            </div>
            <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Entré</dt>
                <dd className="font-medium tabular-nums">{l.paid > 0 ? fmt(l.paid) : "—"}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Reste</dt>
                <dd>
                  <Reste ligne={l} consolide={ledger.consolide} />
                </dd>
              </div>
              {ledger.accepts_in_kind && l.deposited_at && (
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Déposé le</dt>
                  <dd className="font-medium">{jour(l.deposited_at)}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
