"use client"

import Link from "next/link"
import type { Route } from "next"
import { Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { usePermissions } from "@/lib/hooks/usePermissions"

/**
 * Ce que voit, sur l'onglet Paiements, qui n'a pas le droit de lire la caisse.
 *
 * L'écran affirmait « Aucun frais associé à cette inscription » : un fait sur
 * le dossier de l'élève, alors que c'est une porte fermée sur le lecteur. Un
 * éducateur en concluait que déclarer un dépôt en nature n'existait pas —
 * alors qu'il y a droit, et que l'écran qui le lui permet est à deux clics.
 *
 * Le lien vers la saisie par classe n'apparaît qu'à qui peut réellement y
 * entrer. Un lien qui mène à un 403 remplace une frustration par une autre.
 */
export function NoPaymentAccessNotice() {
  const { has } = usePermissions()
  const peutSaisirEnLot = has("enrollments:update")

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <Lock aria-hidden className="h-8 w-8 text-muted-foreground/50" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Les versements ne vous sont pas ouverts</p>
          <p className="text-sm text-muted-foreground">
            Le détail des frais et l&apos;historique des paiements de cet élève relèvent de la
            caisse. Cela ne dit rien de son dossier : il peut très bien porter des frais.
          </p>
        </div>
        {peutSaisirEnLot ? (
          <p className="text-sm text-muted-foreground">
            Pour déclarer qu&apos;un élève a remis un article, passez par{" "}
            <Link
              href={"/admin/enrollments/saisie-classe" as Route}
              className="font-medium text-primary underline underline-offset-2"
            >
              Saisie par classe
            </Link>
            .
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Adressez-vous à la comptabilité pour toute question sur les frais de cet élève.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
