"use client"

import Link from "next/link"
import type { Route } from "next"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CategoryLedger, LedgerRow, LedgerStatus } from "@/lib/contracts/fee-category-ledger"

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} F`

/**
 * Ce que chaque ligne offre au bout, et qui décide de l'offrir.
 *
 * `onEncaisser` est absent quand l'appelant n'a pas `payments:create` : le droit
 * se lit dans la matrice, jamais dans un rôle, et il se lit une seule fois, chez
 * l'appelant. Le bouton disparaît alors — la fiche élève, elle, reste, parce
 * qu'une ligne qui ne mène nulle part renvoie le lecteur à un fichier, c'est-à-
 * dire hors du produit.
 */
interface ActionsDeLigne {
  onEncaisser?: (ligne: LedgerRow) => void
}

/**
 * Les états sur lesquels encaisser a un sens.
 *
 * Le même état que la pastille et que le seau, jamais un montant recomparé :
 * deux règles pour une seule question, c'est l'élève à 99,95 % rangé « à jour »
 * dans l'onglet « partiels ». Il vient du serveur et se lit tel quel.
 */
const DOIT_ENCORE = new Set<LedgerStatus>(["pending", "partial"])

/**
 * L'état d'une ligne : son mot, sa lettre, sa couleur.
 *
 * La lettre n'est pas décorative. Le document se lit en plein soleil sur un
 * écran d'entrée de gamme, et un daltonien ne distingue pas l'ambre du vert :
 * la couleur ne porte jamais l'information toute seule.
 *
 * Les mots sont ceux du document (`ledger_labels.ETATS` côté serveur) : le
 * comptable lit l'écran et le PDF côte à côte, et deux vocabulaires pour les
 * mêmes états lui feraient croire à deux classements.
 */
export const ETATS: Record<LedgerStatus, { label: string; mark: string; tone: string }> = {
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
    label: "Déposé en nature",
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

/**
 * Un montant, ou son absence.
 *
 * **Un tiret dit « on ne sait pas », jamais « zéro ».** Le document a corrigé
 * la même faute : il écrivait « — » sous une ligne soldée pendant que le
 * classeur écrivait « 0 F », et le même élève sortait « inconnu » dans l'un et
 * « soldé » dans l'autre. On teste donc l'absence, jamais la fausseté.
 */
function Montant({ valeur }: { valeur: number | null }) {
  if (valeur === null) {
    return <span className="text-muted-foreground">—</span>
  }
  return <span className="tabular-nums">{fmt(valeur)}</span>
}

/** La fiche de l'élève, atteignable par son nom : la destination minimale d'une ligne. */
function LienFiche({ ligne, className }: { ligne: LedgerRow; className?: string }) {
  return (
    <Link
      href={`/admin/students/${ligne.student_id}` as Route}
      className={cn(
        "rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {ligne.last_name} {ligne.first_name}
    </Link>
  )
}

export function LedgerTable({ ledger, onEncaisser }: { ledger: CategoryLedger } & ActionsDeLigne) {
  // La colonne « Reste » ne se calcule que sur tout l'argent reçu. Sans ce
  // droit, elle sortirait en tirets sur toutes les lignes sous un en-tête qui
  // promet des francs : une colonne qu'on ne peut pas remplir se retire, elle
  // ne se remplit pas de tirets. C'est la règle du document (`colonnes()`).
  const reste = ledger.consolide
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
                <th className="px-3 py-2.5 text-right font-medium">Dû</th>
                <th className="px-3 py-2.5 text-right font-medium">Entré</th>
                {reste && <th className="px-3 py-2.5 text-right font-medium">Reste</th>}
                {ledger.accepts_in_kind && (
                  <th className="px-3 py-2.5 text-left font-medium">Déposé le</th>
                )}
                <th className="px-3 py-2.5 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ledger.lignes.map((l) => (
                <tr key={l.enrollment_id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <LienFiche ligne={l} className="font-medium" />
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
                  <td className="px-3 py-2.5 text-right">
                    <Montant valeur={l.due} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Montant valeur={l.paid} />
                  </td>
                  {reste && (
                    <td className="px-3 py-2.5 text-right font-medium">
                      <Montant valeur={l.remaining} />
                    </td>
                  )}
                  {ledger.accepts_in_kind && (
                    <td className="px-3 py-2.5 text-muted-foreground">{jour(l.deposited_at)}</td>
                  )}
                  <td className="px-3 py-2.5 text-right">
                    {onEncaisser && DOIT_ENCORE.has(l.status) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9"
                        onClick={() => onEncaisser(l)}
                      >
                        Encaisser
                        <span className="sr-only">
                          {" "}
                          pour {l.last_name} {l.first_name}
                        </span>
                      </Button>
                    ) : (
                      // Rien à encaisser ici, ou pas le droit : la ligne mène
                      // quand même quelque part. Un bout de ligne mort renvoie
                      // le lecteur au fichier exporté, hors du produit.
                      <Link
                        href={`/admin/students/${l.student_id}` as Route}
                        className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Fiche
                        <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                        <span className="sr-only">
                          de {l.last_name} {l.first_name}
                        </span>
                      </Link>
                    )}
                  </td>
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
 * Sept colonnes à faire défiler de côté sur 5,5 pouces, c'est sept occasions de
 * perdre la ligne qu'on lisait — et ce document se consulte au guichet.
 */
export function LedgerCards({ ledger, onEncaisser }: { ledger: CategoryLedger } & ActionsDeLigne) {
  return (
    <div className="space-y-2">
      {ledger.lignes.map((l) => (
        <Card key={l.enrollment_id} className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  <LienFiche ligne={l} />
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
                <dt className="text-muted-foreground">Dû</dt>
                <dd className="font-medium">
                  <Montant valeur={l.due} />
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Entré</dt>
                <dd className="font-medium">
                  <Montant valeur={l.paid} />
                </dd>
              </div>
              {/* Comme au tableau : sans le droit de tout lire, la donnée est
                  absente, et une ligne « Reste — » se lirait comme un solde. */}
              {ledger.consolide && (
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Reste</dt>
                  <dd className="font-medium">
                    <Montant valeur={l.remaining} />
                  </dd>
                </div>
              )}
              {ledger.accepts_in_kind && l.deposited_at && (
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Déposé le</dt>
                  <dd className="font-medium">{jour(l.deposited_at)}</dd>
                </div>
              )}
            </dl>

            {/* Cibles tactiles pleines : cette carte se lit au guichet, sur un
                téléphone, en tenant la monnaie de l'autre main. */}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Button asChild type="button" variant="outline" className="h-11 flex-1">
                <Link href={`/admin/students/${l.student_id}` as Route}>
                  Voir la fiche
                  <ArrowUpRight aria-hidden className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              {onEncaisser && DOIT_ENCORE.has(l.status) && (
                <Button type="button" className="h-11 flex-1" onClick={() => onEncaisser(l)}>
                  Encaisser
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
