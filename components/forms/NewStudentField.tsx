"use client"

import { useEffect, useRef } from "react"
import { AlertTriangle, Info, Loader2 } from "lucide-react"
import { useNewStudentSuggestion } from "@/lib/hooks/useEnrollments"
import { NewStudentChoiceGroup } from "@/components/forms/NewStudentChoiceGroup"

interface NewStudentFieldProps {
  /** Absent quand l'élève est créé dans le même formulaire : rien à interroger. */
  studentId?: number
  academicYearId?: number
  /** `null` = personne n'a encore répondu. Le champ part toujours à `null`. */
  value: boolean | null | undefined
  onChange: (value: boolean | null) => void
  /** Renseigné quand on a tenté de continuer sans répondre. */
  error?: string
}

/**
 * Le profil de l'inscription : nouvel élève, ou déjà inscrit ici avant.
 *
 * La question est posée, jamais devinée. Tant que l'école n'a pas déclaré son
 * historique exploitable, le serveur ne suggère rien : l'absence d'inscription
 * antérieure ne distingue pas un nouvel élève d'un ancien pas encore saisi, et
 * une réponse par défaut facturerait la chemise cartonnée à toute une école.
 * La secrétaire, elle, sait. On lui pose donc la question, sans rien
 * présélectionner, et on refuse de continuer sans réponse.
 *
 * Quand le serveur suggère quelque chose, la réponse est pré-remplie avec sa
 * phrase à côté, et reste corrigeable.
 */
export function NewStudentField({
  studentId,
  academicYearId,
  value,
  onChange,
  error,
}: NewStudentFieldProps) {
  const { data: suggestion, isError, isFetching } = useNewStudentSuggestion(studentId, academicYearId)
  const prefilledFor = useRef<number | undefined>(undefined)
  const answeredFor = useRef<number | undefined>(studentId)

  useEffect(() => {
    // Changer d'élève dans le formulaire remet le profil à zéro. Sans cela,
    // l'inscription du second élève partait avec la réponse donnée pour le
    // premier, et donc avec ses frais.
    if (answeredFor.current !== studentId) {
      answeredFor.current = studentId
      prefilledFor.current = undefined
      onChange(null)
      return
    }
    // La suggestion pré-remplit une fois par élève, et ne réécrit jamais une
    // réponse déjà donnée : la secrétaire qui a corrigé ne doit pas voir le
    // serveur reprendre la main au premier rechargement.
    if (!suggestion || prefilledFor.current === studentId) return
    prefilledFor.current = studentId
    // Rien a pre-remplir quand le serveur ne sait pas : la valeur est deja
    // `null` et la reponse appartient a la secretaire. Appeler `onChange`
    // pour reecrire `null` par-dessus `null` ne changeait rien a la valeur
    // mais effacait le message qui venait de lui dire de repondre : elle
    // etait renvoyee a l'etape sans savoir pourquoi.
    if (suggestion.suggested === null) return
    if (value === null || value === undefined) onChange(suggestion.suggested)
  }, [studentId, suggestion, value, onChange])

  const answered = value === true || value === false
  const cannotTell = !studentId || isError || suggestion?.suggested === null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-none">
        L&apos;élève est-il nouveau dans l&apos;établissement ?
        <span className="ml-1 text-destructive" aria-hidden>
          *
        </span>
      </p>
      <p className="text-xs text-muted-foreground">
        Ce choix change la facture : certains frais ne sont dus que par les nouveaux élèves,
        d&apos;autres que par les anciens. C&apos;est pourquoi la question est posée plutôt que
        devinée.
      </p>

      <NewStudentChoiceGroup value={value} onChange={onChange} invalid={!!error && !answered} />

      {error && !answered ? (
        <p
          role="alert"
          className="flex items-start gap-1.5 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">{error}</span>
        </p>
      ) : null}

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

      {!answered ? (
        <p className="text-xs text-muted-foreground">
          Tant que la question n&apos;est pas tranchée, aucun de ces frais n&apos;est facturé.
        </p>
      ) : null}
    </div>
  )
}
