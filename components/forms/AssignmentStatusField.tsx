"use client"

import type { Control, FieldValues, Path } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ASSIGNMENT_STATUSES } from "@/lib/contracts/enrollment"

interface AssignmentStatusFieldProps<T extends FieldValues> {
  control: Control<T>
  statusName: Path<T>
  decisionName: Path<T>
  /** Statut courant, pour n'afficher le numéro de décision que s'il sert. */
  status: string | null | undefined
  /**
   * Appelé quand le statut cesse d'être subventionné : le formulaire parent
   * doit alors vider le numéro de décision, sans quoi une valeur périmée
   * continue de voyager.
   */
  onDecisionCleared?: () => void
}

/**
 * Statut d'affectation et numéro de décision.
 *
 * Le statut décide du tarif appliqué : un élève affecté est subventionné par
 * l'État et paie sensiblement moins. Il est donc saisi à la création, pas
 * après coup, sinon l'inscription se crée avec les mauvais frais et la
 * famille peut recevoir un montant erroné avant qu'on le corrige.
 *
 * Le numéro de décision n'apparaît que pour un affecté ou un réaffecté : le
 * demander à une famille non affectée n'aurait aucun sens.
 */
export function AssignmentStatusField<T extends FieldValues>({
  control,
  statusName,
  decisionName,
  status,
  onDecisionCleared,
}: AssignmentStatusFieldProps<T>) {
  const subsidised = status === "affecte" || status === "reaffecte"

  return (
    <div className="space-y-3">
      <FormField
        control={control}
        name={statusName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Affectation</FormLabel>
            <Select
              value={field.value ?? "non_renseigne"}
              onValueChange={(v) => {
                const next = v === "non_renseigne" ? null : v
                field.onChange(next)
                // Repasser en « non affecté » masque le numéro de décision
                // mais laissait sa valeur dans le formulaire : un numéro
                // périmé partait alors au serveur, rattaché à un élève qui
                // n'est plus affecté. On le vide avec le statut.
                if (next !== "affecte" && next !== "reaffecte") {
                  onDecisionCleared?.()
                }
              }}
            >
              <FormControl>
                <SelectTrigger className="h-11 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="non_renseigne">Non renseigné</SelectItem>
                {ASSIGNMENT_STATUSES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {ASSIGNMENT_STATUSES.find((o) => o.value === status)?.hint ??
                "Tant que ce n'est pas renseigné, les montants communs à tous s'appliquent."}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {subsidised ? (
        <FormField
          control={control}
          name={decisionName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de décision d&apos;affectation</FormLabel>
              <FormControl>
                <Input
                  className="h-11 sm:h-10"
                  placeholder="Ex : 2025-DRENA-04521"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Réclamé par le rapport de fin de trimestre.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </div>
  )
}
