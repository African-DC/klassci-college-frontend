"use client"

import { useEffect, useRef } from "react"
import { AlertTriangle, Check, Info, Loader2 } from "lucide-react"
import { useNewStudentSuggestion } from "@/lib/hooks/useStudents"
import { cn } from "@/lib/utils"

interface NewStudentFieldProps {
  /** Absent quand l'élève est créé dans le même formulaire : rien à interroger. */
  studentId?: number
  academicYearId?: number
  /** `undefined` = pas encore renseigné, `null` = laissé en suspens sciemment. */
  value: boolean | null | undefined
  onChange: (value: boolean | null) => void
}

const CHOICES = [
  { value: true as const, label: "Oui, il arrive cette année" },
  { value: false as const, label: "Non, il était déjà là" },
  { value: null, label: "Je ne peux pas trancher" },
]

/**
 * Le profil de l'inscription : nouvel élève, ancien élève, ou pas tranché.
 *
 * Trois états, et le troisième compte autant que les deux autres. Une case à
 * cocher ordinaire ne sait pas dire « on ne sait pas » : décochée, elle
 * affirmerait « ancien élève », ce qui reviendrait à choisir un montant à la
 * place de l'école. On propose donc les trois réponses en toutes lettres, et
 * l'état retenu se lit au pictogramme autant qu'à la couleur, pour un écran
 * d'entrée de gamme en plein soleil.
 */
export function NewStudentField({ studentId, academicYearId, value, onChange }: NewStudentFieldProps) {
  const { data: suggestion, isError, isFetching } = useNewStudentSuggestion(studentId, academicYearId)
  const prefilled = useRef(false)

  // La suggestion pré-remplit une fois. Elle ne réécrit jamais un choix déjà
  // fait : la secrétaire qui a corrigé la case ne doit pas la voir se remettre
  // toute seule sur l'avis du serveur au premier rechargement.
  useEffect(() => {
    if (!suggestion || prefilled.current) return
    prefilled.current = true
    if (value === undefined) onChange(suggestion.suggested)
  }, [suggestion, value, onChange])

  const undecided = value === null || value === undefined
  const cannotTell = !studentId || isError || suggestion?.suggested === null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-none">Nouvel élève ?</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {CHOICES.map((choice) => {
          const selected = value === choice.value
          return (
            <button
              key={String(choice.value)}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(choice.value)}
              className={cn(
                "flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                selected
                  ? "border-primary bg-primary/10 font-semibold text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                )}
              >
                {selected ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span className="min-w-0 break-words">{choice.label}</span>
            </button>
          )
        })}
      </div>

      {isFetching ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Vérification des inscriptions antérieures...
        </p>
      ) : null}

      {!isFetching && suggestion && suggestion.suggested !== null ? (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">
            {suggestion.reason} Corrigez si la réalité diffère.
          </span>
        </p>
      ) : null}

      {!isFetching && cannotTell ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">
            <strong>C&apos;est à vous de trancher.</strong>{" "}
            {suggestion?.reason ??
              (studentId
                ? "La suggestion n'a pas pu être chargée."
                : "Cet élève n'existe pas encore en base, personne ne peut donc affirmer qu'il arrive cette année.")}{" "}
            Si l&apos;année précédente n&apos;a jamais été saisie ici, l&apos;absence
            d&apos;inscription antérieure ne prouve rien : une famille présente depuis trois ans
            y ressemble trait pour trait. Vous, vous savez.
          </span>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Ce choix change la facture : certains frais ne sont dus que par les nouveaux élèves,
        d&apos;autres que par les anciens.{" "}
        {undecided
          ? "Tant qu'il n'est pas tranché, aucun de ces frais n'est facturé."
          : "Les frais réservés à l'autre profil ne seront pas facturés."}
      </p>
    </div>
  )
}
