"use client";

import Link from "next/link";
import type { Route } from "next";
import { Lock, Package, PackageOpen, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionTitle } from "@/components/shared/PageHero";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useDepositableFees } from "@/lib/hooks/useInKindRoster";
import { gesteDepot } from "@/lib/contracts/in-kind-roster";
import { cn } from "@/lib/utils";
import { InKindDepositDialogs } from "./InKindDepositDialogs";
import { useInKindDepositActions } from "./useInKindDepositActions";

/**
 * Ce que voit, sur l'onglet Paiements, qui inscrit sans lire la caisse.
 *
 * L'éducateur reçoit le paquet de rames dans la cour et porte
 * `enrollments:update` : le dépôt en nature est son geste, pas celui du
 * guichet. Mais l'onglet n'affichait ses articles qu'au travers du détail des
 * frais, qui est fait de montants et relève de `payments:read` — il tombait
 * donc sur une porte close et en concluait que déclarer un dépôt depuis la
 * fiche n'existait pas. Le renvoyer vers la saisie par classe ne suffisait
 * pas : quand on tient un dossier ouvert, on veut le régler là.
 *
 * Le panneau ne montre que ce qu'il a le droit de lire — l'article et son
 * état, jamais un franc. Le reste à payer, l'historique des versements et
 * l'échéancier restent derrière `payments:read`, et cet écran ne les laisse
 * pas deviner : un article déposé ne dit pas ce qu'il aurait coûté.
 */
export function InKindDepositPanel({
  enrollmentId,
  studentName,
}: {
  enrollmentId: number;
  studentName?: string;
}) {
  const { has } = usePermissions();
  const peutDeposer = has("enrollments:update");
  const { data: articles, isLoading } = useDepositableFees(enrollmentId);
  const actions = useInKindDepositActions(enrollmentId);

  if (isLoading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  const liste = articles ?? [];

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="flex items-start gap-3 px-5 py-4">
          <Lock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Les montants ne vous sont pas ouverts</p>
            <p className="text-sm text-muted-foreground">
              Le reste à payer et l&apos;historique des versements relèvent de la caisse. Vous
              pouvez en revanche déclarer ici les articles que la famille a remis.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <SectionTitle icon={Package}>Articles à remettre</SectionTitle>

          {liste.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <PackageOpen aria-hidden className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Aucun article de cette inscription n&apos;accepte de dépôt. Les frais qui se
                règlent en argent n&apos;apparaissent pas ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {liste.map((article) => {
                const geste = gesteDepot(article);
                const depose = geste === "annuler";
                const enCours = actions.ligneEnCours === article.fee_id;
                const etat =
                  geste === "annuler"
                    ? "Déposé"
                    : geste === "deposer"
                      ? "À remettre"
                      : "Plus à remettre";
                return (
                  <div
                    key={article.fee_id}
                    className="flex flex-col gap-2 py-3 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Package
                        aria-hidden
                        className={cn(
                          "h-4 w-4 shrink-0",
                          depose ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground",
                        )}
                      />
                      <span className="truncate text-sm font-medium">
                        {article.category_name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-[11px] font-semibold uppercase tracking-wide",
                          depose ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground",
                        )}
                      >
                        {etat}
                      </span>
                    </div>

                    {/* Le bouton n'apparaît qu'à qui peut écrire : un geste
                        proposé puis refusé en 403 remplace une frustration
                        par une autre. */}
                    {peutDeposer && geste !== "aucun" ? (
                      depose ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-11 w-full gap-1.5 text-xs sm:h-9 sm:w-auto"
                          disabled={enCours}
                          onClick={() =>
                            actions.demanderAnnulation({
                              id: article.fee_id,
                              name: article.category_name,
                            })
                          }
                        >
                          <Undo2 aria-hidden className="h-3.5 w-3.5" />
                          {enCours ? "Annulation…" : "Annuler le dépôt"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-11 w-full text-xs sm:h-9 sm:w-auto"
                          disabled={enCours}
                          onClick={() =>
                            actions.demanderDepot({
                              id: article.fee_id,
                              name: article.category_name,
                            })
                          }
                        >
                          {enCours ? "Enregistrement…" : "Marquer déposé"}
                        </Button>
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {peutDeposer ? (
            <p className="pt-1 text-xs text-muted-foreground">
              Toute une classe à la fois ?{" "}
              <Link
                href={"/admin/enrollments/saisie-classe" as Route}
                className="font-medium text-primary underline underline-offset-2"
              >
                Saisie par classe
              </Link>
              .
            </p>
          ) : (
            <p className="pt-1 text-xs text-muted-foreground">
              Adressez-vous à la comptabilité pour toute question sur les frais de cet élève.
            </p>
          )}
        </CardContent>
      </Card>

      <InKindDepositDialogs actions={actions} studentName={studentName} />
    </div>
  );
}
