"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useWhatsNew, type Nouveaute } from "@/lib/hooks/useWhatsNew"

/** Le mot de chaque section, du point de vue de qui lit. */
const SECTION_LABEL: Record<string, string> = {
  Added: "Ce qui est nouveau",
  Changed: "Ce qui a changé",
  Fixed: "Ce qui est réparé",
  Security: "Sécurité",
  Deprecated: "Ce qui va disparaître",
  Removed: "Ce qui a disparu",
}

/**
 * « Nouveautés » : ce qui a changé pour la personne qui regarde.
 *
 * Un Show-résumé, donc une fenêtre et non une page, comme la règle des écrans
 * le demande. Elle s'ouvre d'elle-même quand il y a du neuf depuis la dernière
 * visite, et une seule fois : la refermer vaut « j'ai lu », et le marqueur ne
 * rebouge qu'au prochain changelog.
 *
 * **Chaque ligne est filtrée sur le rôle.** Un parent n'a rien à faire d'une
 * note sur la sauvegarde nocturne, et lui montrer du vocabulaire d'exploitation
 * l'inquiéterait sans l'informer. Une ligne que le changelog n'adresse à
 * personne est transverse, et va donc à tout le monde.
 */
export function WhatsNewModal() {
  const { lignes, total, duNeuf, marquerVu } = useWhatsNew()
  const [ouvert, setOuvert] = useState(false)

  useEffect(() => {
    if (duNeuf) setOuvert(true)
  }, [duNeuf])

  function fermer() {
    setOuvert(false)
    marquerVu()
  }

  if (lignes.length === 0) return null

  const parSection = new Map<string, Nouveaute[]>()
  for (const ligne of lignes) {
    parSection.set(ligne.section, [...(parSection.get(ligne.section) ?? []), ligne])
  }

  const reste = total - lignes.length

  return (
    <Dialog open={ouvert} onOpenChange={(v) => (v ? setOuvert(true) : fermer())}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles aria-hidden className="h-5 w-5 text-accent" />
            Nouveautés
          </DialogTitle>
          <DialogDescription>
            Ce qui a changé dans KLASSCI depuis votre dernière visite.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {[...parSection.entries()].map(([section, entrees]) => (
            <section key={section} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {SECTION_LABEL[section] ?? section}
              </h3>
              <ul className="space-y-2">
                {entrees.map((entree, i) => (
                  <li key={`${section}-${i}`} className="flex gap-2.5 text-sm leading-snug">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{entree.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {reste > 0 && (
          // Dire ce qu'on ne montre pas : une liste tronquée en silence laisse
          // croire qu'on a tout lu.
          <p className="text-xs text-muted-foreground">
            Les changements les plus récents. {reste} autres ne sont pas repris ici.
          </p>
        )}

        <DialogFooter>
          <Button onClick={fermer} className="h-11 w-full sm:h-10 sm:w-auto">
            J&apos;ai lu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
