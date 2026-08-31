"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Choice {
  value: boolean | null
  label: string
  hint: string
}

/**
 * Les deux réponses possibles à la question qui change la facture.
 *
 * Elles sont formulées du point de vue de l'école, pas de la base : « déjà
 * inscrit ici avant » se répond de mémoire, « a une inscription antérieure en
 * base » ne se répond pas du tout quand l'année précédente n'est pas saisie.
 */
export const NEW_STUDENT_CHOICES: Choice[] = [
  { value: true, label: "Nouvel élève", hint: "Il arrive dans l'école cette année" },
  { value: false, label: "Déjà inscrit ici avant", hint: "Il était là l'an dernier ou avant" },
]

/** Seulement là où remettre une inscription en suspens a un sens : sa fiche. */
export const UNDECIDED_CHOICE: Choice = {
  value: null,
  label: "Non tranché",
  hint: "Aucun frais réservé à l'un ou l'autre profil n'est facturé",
}

interface NewStudentChoiceGroupProps {
  value: boolean | null | undefined
  onChange: (value: boolean | null) => void
  /** Ajoute « Non tranché » : une correction doit pouvoir remettre en suspens. */
  allowUndecided?: boolean
  disabled?: boolean
  /** Signale la réponse manquante autrement que par la couleur seule. */
  invalid?: boolean
}

/**
 * Les réponses au profil d'inscription, en toutes lettres.
 *
 * Une case à cocher ne sait pas dire « on ne sait pas » : décochée, elle
 * affirme « ancien élève » et choisit un montant à la place de l'école. Des
 * boutons distincts, sans présélection, obligent à répondre.
 *
 * Cibles `min-h-11`, une par ligne sur téléphone, libellés qui reviennent à la
 * ligne : on répond au pouce, en plein soleil, sans zoomer. L'état retenu se
 * lit à la coche et à la graisse du texte autant qu'à la couleur.
 */
export function NewStudentChoiceGroup({
  value,
  onChange,
  allowUndecided = false,
  disabled = false,
  invalid = false,
}: NewStudentChoiceGroupProps) {
  const choices = allowUndecided ? [...NEW_STUDENT_CHOICES, UNDECIDED_CHOICE] : NEW_STUDENT_CHOICES

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2",
        allowUndecided ? "sm:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {choices.map((choice) => {
        const selected = value !== undefined && value === choice.value
        return (
          <button
            key={String(choice.value)}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(choice.value)}
            className={cn(
              "flex min-h-11 w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50",
              !selected && invalid && "border-destructive/60",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40",
              )}
            >
              {selected ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
            <span className="min-w-0 break-words">
              <span className={cn("block text-sm", selected && "font-semibold")}>{choice.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{choice.hint}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
