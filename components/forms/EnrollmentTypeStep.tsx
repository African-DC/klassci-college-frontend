"use client"

import { RefreshCw, UserPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type EnrollmentType = "new" | "re-enrollment"

const OPTIONS = [
  {
    value: "new" as const,
    icon: UserPlus,
    title: "Nouvelle inscription",
    hint: "Inscrire un élève qui n'est pas encore dans le logiciel",
  },
  {
    value: "re-enrollment" as const,
    icon: RefreshCw,
    title: "Réinscription",
    hint: "Réinscrire un élève déjà enregistré",
  },
]

/**
 * Le premier choix du formulaire : créer l'élève, ou repartir d'un existant.
 *
 * Il dit qui l'on saisit, pas si l'élève est nouveau dans l'école : une école
 * qui rattrape son fichier crée aussi des élèves présents depuis trois ans.
 * C'est le profil de l'inscription, à l'étape Classe, qui tranche cela.
 */
export function EnrollmentTypeStep({
  value,
  onChange,
}: {
  value: EnrollmentType | null
  onChange: (value: EnrollmentType) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choisissez le type d&apos;inscription à effectuer.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = value === option.value
          return (
            <Card
              key={option.value}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              className={cn(
                "cursor-pointer transition-colors hover:border-primary/50",
                selected && "border-primary ring-2 ring-primary/20",
              )}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onChange(option.value)
                }
              }}
            >
              <CardContent className="flex flex-col items-center gap-3 pb-4 pt-6">
                <div
                  className={cn(
                    "rounded-full p-3",
                    selected ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <option.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">{option.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{option.hint}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
