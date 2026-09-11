"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentFees } from "@/lib/hooks/useStudents";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { isCashDue } from "@/lib/contracts/payment";
import { countFeeLines } from "@/lib/enrollment/fee-lines";
import { FeeSummaryHero } from "@/components/shared/fees/FeeSummaryHero";
import { RegenerateFeesAction } from "@/components/shared/fees/RegenerateFeesAction";
import {
  EnrollmentFeesBreakdown,
  type EnrollmentFeeItem,
} from "@/components/admin/payments/EnrollmentFeesBreakdown";
import { PaymentHistoryList } from "@/components/admin/payments/PaymentHistoryList";
import { StudentPaymentModal } from "@/components/admin/students/tabs/StudentPaymentModal";
import { EnrollmentScheduleCard } from "@/components/admin/installments/EnrollmentScheduleCard";
import { NoPaymentAccessNotice } from "@/components/admin/enrollments/tabs/NoPaymentAccessNotice";
import { InKindDepositPanel } from "@/components/admin/enrollments/in-kind/InKindDepositPanel";
import { InKindDepositDialogs } from "@/components/admin/enrollments/in-kind/InKindDepositDialogs";
import { useInKindDepositActions } from "@/components/admin/enrollments/in-kind/useInKindDepositActions";

interface EnrollmentPaymentsTabProps {
  enrollmentId: number;
  enrollment?: { student_id?: number };
  /** Nommé dans les confirmations : on solde le frais d'un élève, pas d'un numéro. */
  studentName?: string;
}

export function EnrollmentPaymentsTab({
  enrollmentId,
  enrollment,
  studentName,
}: EnrollmentPaymentsTabProps) {
  // Cet onglet lit les frais via `payments:read`. Sans ce droit, l'appel part
  // en 403, la liste retombe a vide, et l'ecran affirmait « Aucun frais
  // associe a cette inscription » — un fait sur le dossier de l'eleve, alors
  // que c'est une porte fermee sur le lecteur. Un educateur en concluait que
  // declarer un depot en nature n'existait pas, alors qu'il y a droit.
  const { has, isLoading: chargementDroits } = usePermissions();
  const peutLireLesVersements = has("payments:read");
  const peutDeposerEnNature = has("enrollments:update");

  const [paymentOpen, setPaymentOpen] = useState(false);
  // Poser et defaire un depot vivent dans un hook partage : le panneau servi a
  // qui n'a pas `payments:read` pose exactement le meme geste, et deux copies
  // des memes mutations auraient fini par rafraichir deux jeux de vues.
  const depots = useInKindDepositActions(enrollmentId);
  const queryClient = useQueryClient();
  const studentId = enrollment?.student_id;

  // Le même appel validé que la fiche élève, filtré sur cette inscription :
  // deux écrans qui lisent les mêmes frais ne doivent pas les chercher de deux
  // façons différentes, ni afficher deux totaux.
  const { data: allFees, isLoading } = useStudentFees(studentId ?? 0);
  const feeList = useMemo(
    () => (allFees ?? []).filter((fee) => fee.enrollment_id === enrollmentId),
    [allFees, enrollmentId],
  );

  const cashFees = feeList.filter((f) => isCashDue(f.status));
  const totalExpected = cashFees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = cashFees.reduce((s, f) => s + f.paid, 0);
  const totalRemaining = Math.max(0, totalExpected - totalPaid);
  // Le décompte n'est pas « payé ou non » : une ligne exonérée ou déposée en
  // nature est soldée sans versement, et ne se range dans aucune des deux
  // colonnes que la confirmation annonce.
  // `undefined` tant que la requete n'a rien rendu : desactivee, en erreur, ou
  // encore en vol. `allFees ?? []` ecrase ces trois cas en « liste vide », et
  // la confirmation affirmait alors « 0 ligne » sur un ecran qui s'apprete a
  // reecrire des frais. Le composant sait dire qu'il ne sait pas.
  const feeLines = useMemo(
    () => (allFees ? countFeeLines(feeList) : undefined),
    [allFees, feeList],
  );

  if (chargementDroits) {
    return <Skeleton className="h-40 rounded-2xl" />;
  }

  // Sans le droit de lire la caisse, l'onglet ne se ferme plus : il rend ce que
  // cette personne-la PEUT faire. L'educateur porte `enrollments:update` et
  // recoit les articles dans la cour ; lui montrer une porte close lui a fait
  // croire que declarer un depot depuis la fiche n'existait pas.
  if (!peutLireLesVersements) {
    return peutDeposerEnNature ? (
      <InKindDepositPanel
        enrollmentId={enrollmentId}
        studentName={studentName}
      />
    ) : (
      <NoPaymentAccessNotice />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  const nomArticle = (fee: EnrollmentFeeItem) =>
    fee.option_name ?? fee.category_name;
  const eleve = studentName?.trim() ? studentName : "cet élève";

  return (
    <div className="space-y-4">
      <FeeSummaryHero
        totalExpected={totalExpected}
        totalPaid={totalPaid}
        totalRemaining={totalRemaining}
      />

      {/* Placé juste sous la synthèse : « combien reste-t-il ? » appelle
          immédiatement « et pour quand ? ». Le retard affiché compare ce qui
          est déjà exigible au versé, jamais le total de l'année. */}
      <EnrollmentScheduleCard enrollmentId={enrollmentId} />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <RegenerateFeesAction
          enrollmentIds={[enrollmentId]}
          subject={`${eleve}, pour cette inscription`}
          feeLines={feeLines}
        />
        {studentId && totalRemaining > 0 ? (
          <Button
            onClick={() => setPaymentOpen(true)}
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Enregistrer un paiement
          </Button>
        ) : null}
      </div>

      <EnrollmentFeesBreakdown
        fees={feeList}
        onMarkDeposited={(fee) =>
          depots.demanderDepot({ id: fee.id, name: nomArticle(fee) })
        }
        onCancelDeposit={(fee) =>
          depots.demanderAnnulation({ id: fee.id, name: nomArticle(fee) })
        }
        markingFeeId={depots.ligneEnCours}
      />

      <PaymentHistoryList enrollmentId={enrollmentId} />

      <InKindDepositDialogs actions={depots} studentName={studentName} />

      {studentId && (
        <StudentPaymentModal
          studentId={studentId}
          open={paymentOpen}
          onClose={() => {
            setPaymentOpen(false);
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({
              queryKey: ["payments", "enrollment", enrollmentId],
            });
          }}
        />
      )}
    </div>
  );
}
