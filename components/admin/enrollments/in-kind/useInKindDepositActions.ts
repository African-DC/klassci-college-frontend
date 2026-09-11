"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { enrollmentsApi } from "@/lib/api/enrollments";
import { invalidateEnrollmentFeeViews } from "@/lib/hooks/useEnrollments";

/**
 * Un article qu'on s'apprête à déposer, ou dont on défait le dépôt.
 *
 * Le minimum que les deux écrans partagent : la ligne du serveur et son nom
 * lisible. L'onglet Paiements travaille sur des frais chiffrés, le panneau de
 * l'éducateur sur des articles sans montant — la confirmation, elle, ne nomme
 * jamais qu'un article.
 */
export interface DepositTarget {
  id: number;
  name: string;
}

/**
 * Poser un dépôt en nature, ou le défaire, depuis la fiche d'inscription.
 *
 * Extrait de l'onglet Paiements parce qu'un second écran le refait : celui que
 * voit l'éducateur, qui n'a pas le droit de lire la caisse. Deux copies des
 * mêmes mutations auraient fini par invalider deux jeux de vues différents, et
 * l'un des deux écrans serait resté en retard d'un geste sur l'autre.
 *
 * Les vues rafraîchies sont celles de `invalidateEnrollmentFeeViews`, dont
 * l'échéancier : le dû de la famille vient de bouger, et le bandeau « En retard
 * de X F » se calcule dessus. Sans lui, l'écran contredit pendant une minute
 * l'action qu'il vient de confirmer.
 */
export function useInKindDepositActions(enrollmentId: number) {
  const queryClient = useQueryClient();
  const [aDeposer, setADeposer] = useState<DepositTarget | null>(null);
  const [aAnnuler, setAAnnuler] = useState<DepositTarget | null>(null);

  const rafraichir = () => invalidateEnrollmentFeeViews(queryClient, [enrollmentId]);

  const depot = useMutation({
    mutationFn: (feeId: number) => enrollmentsApi.depositInKind(enrollmentId, feeId),
    onSuccess: () => {
      toast.success("Article marqué déposé");
      rafraichir();
    },
    onError: (err: Error) => {
      toast.error("Impossible de marquer ce frais déposé", { description: err.message });
    },
  });

  const annulation = useMutation({
    mutationFn: (feeId: number) => enrollmentsApi.cancelInKindDeposit(enrollmentId, feeId),
    onSuccess: () => {
      toast.success("Dépôt annulé", {
        description: "Le montant redevient dû en argent, à régler à la caisse.",
      });
      rafraichir();
    },
    onError: (err: Error) => {
      toast.error("Ce dépôt n'a pas pu être annulé", { description: err.message });
    },
  });

  /**
   * La ligne en cours d'écriture, ou `null`.
   *
   * Une seule à la fois : la confirmation est modale, on ne peut pas en lancer
   * deux. Les lignes s'en servent pour désactiver leur propre bouton sans que
   * l'écran entier se fige.
   */
  const ligneEnCours = depot.isPending
    ? (aDeposer?.id ?? null)
    : annulation.isPending
      ? (aAnnuler?.id ?? null)
      : null;

  return {
    aDeposer,
    aAnnuler,
    demanderDepot: setADeposer,
    demanderAnnulation: setAAnnuler,
    depot,
    annulation,
    ligneEnCours,
  };
}
