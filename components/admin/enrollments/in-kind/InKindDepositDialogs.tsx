"use client";

import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import type { useInKindDepositActions } from "./useInKindDepositActions";

/**
 * Les deux confirmations du dépôt en nature, écrites une seule fois.
 *
 * L'onglet Paiements et le panneau de l'éducateur posent le même geste et
 * doivent l'annoncer avec les mêmes mots : ce qu'on déclare, ce que la famille
 * ne devra plus, et que la caisse n'émet aucun reçu. Deux rédactions
 * divergentes auraient fini par ne plus dire la même chose de la même action,
 * sur des écrans que la même personne peut ouvrir l'un après l'autre.
 */
export function InKindDepositDialogs({
  actions,
  studentName,
}: {
  actions: ReturnType<typeof useInKindDepositActions>;
  /** Nommé dans les confirmations : on solde le frais d'un élève, pas d'un numéro. */
  studentName?: string;
}) {
  const { aDeposer, aAnnuler, demanderDepot, demanderAnnulation, depot, annulation } = actions;
  const eleve = studentName?.trim() ? studentName : "cet élève";

  return (
    <>
      <ConfirmActionDialog
        open={!!aDeposer}
        onOpenChange={(next) => {
          if (!next && !depot.isPending) demanderDepot(null);
        }}
        tone="warning"
        title="Marquer cet article comme déposé ?"
        description={`Vous déclarez que ${eleve} a bien remis « ${aDeposer?.name ?? ""} ». Cette ligne sera soldée sans aucun versement : c'est ce geste qui remplace le paiement.`}
        details={
          <>
            <p>
              Article : <span className="font-semibold">{aDeposer?.name ?? ""}</span>
            </p>
            <p className="text-muted-foreground">
              La ligne sort du reste à payer et n&apos;apparaît plus comme impayée, ni ici ni
              dans le portail de la famille. Aucun reçu de caisse n&apos;est émis.
            </p>
          </>
        }
        confirmLabel="Oui, l'article est déposé"
        pendingLabel="Enregistrement..."
        pending={depot.isPending}
        onConfirm={() => {
          if (!aDeposer) return;
          depot.mutate(aDeposer.id, { onSettled: () => demanderDepot(null) });
        }}
      />

      <ConfirmActionDialog
        open={!!aAnnuler}
        onOpenChange={(next) => {
          if (!next && !annulation.isPending) demanderAnnulation(null);
        }}
        tone="warning"
        title="Annuler ce dépôt ?"
        description={`Vous déclarez que ${eleve} n'a finalement pas remis « ${aAnnuler?.name ?? ""} ». La ligne redevient due en argent.`}
        details={
          <>
            <p>
              Article : <span className="font-semibold">{aAnnuler?.name ?? ""}</span>
            </p>
            <p className="text-muted-foreground">
              Le montant réapparaît dans le reste à payer, ici comme dans le portail de la
              famille, et devra être réglé à la caisse. Si un versement encaissé ou en attente
              est imputé sur cette ligne, le serveur refusera : on ne fait pas réapparaître une
              dette payée.
            </p>
          </>
        }
        confirmLabel="Oui, annuler le dépôt"
        pendingLabel="Annulation..."
        pending={annulation.isPending}
        onConfirm={() => {
          if (!aAnnuler) return;
          annulation.mutate(aAnnuler.id, { onSettled: () => demanderAnnulation(null) });
        }}
      />
    </>
  );
}
