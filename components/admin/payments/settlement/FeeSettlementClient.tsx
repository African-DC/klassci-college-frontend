"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Lock, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { PageHero, heroAccentBtn } from "@/components/shared/PageHero"
import { AcademicYearScopeBar } from "@/components/shared/AcademicYearScopeBar"
import { ClassSelect } from "@/components/shared/ClassSelect"
import { SettlementStudentCard } from "@/components/admin/payments/settlement/SettlementStudentCard"
import { SettlementTable } from "@/components/admin/payments/settlement/SettlementTable"
import { feeSettlementApi } from "@/lib/api/fee-settlement"
import { useClassChoice } from "@/lib/hooks/useClassChoice"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
import { useFeeSettlement } from "@/lib/hooks/useFeeSettlement"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { downloadBlob } from "@/lib/utils"

/**
 * Qui a soldé quelle catégorie de frais, une classe à la fois.
 *
 * La fiche d'un élève répondait déjà pour lui. Pour une classe, il fallait
 * ouvrir les dossiers un par un — soixante-dix-huit fois. Et le journal des
 * versements ne remplace pas cette lecture : il liste des versements, pas des
 * élèves, donc celui qui n'a jamais rien versé n'y figure pas du tout, alors
 * que c'est précisément celui qu'on cherche.
 *
 * Le décompte est en tête parce que c'est la première chose qu'on veut savoir,
 * et qu'il ne doit pas se mériter au défilement.
 */
export function FeeSettlementClient() {
  // Le serveur réserve ce tableau à qui consolide toutes les caisses : ce
  // qu'une famille doit se calcule sur tout l'argent reçu, et cloisonné à un
  // guichet il afficherait « Dû » sur une famille qui a payé à côté. Le menu
  // ne le propose donc pas à une caissière — mais l'adresse reste tapable, et
  // sans cette garde l'écran laissait partir un appel voué au 403 pour
  // afficher « Impossible de contacter le serveur » avec un bouton
  // « Réessayer » qui ne pouvait pas aboutir.
  const { has, isLoading: chargementDroits } = usePermissions()
  const peutConsoliderLesCaisses = has("payments:read:all")

  const [pickedYearId, setPickedYearId] = useState<number | undefined>(undefined)
  const { academicYearId, years, isLoading: loadingYears } = useCurrentAcademicYearId(pickedYearId)
  const currentYear = years?.find((y) => y.is_current)

  const {
    classes,
    classId: classeChoisie,
    setClassId,
    isLoading: classesLoading,
    isError: classesEnErreur,
  } = useClassChoice()

  const { data, isLoading, isError, error, refetch } = useFeeSettlement(classeChoisie, academicYearId)
  const [exporting, setExporting] = useState(false)

  async function exporter() {
    if (!classeChoisie || !academicYearId) return
    setExporting(true)
    try {
      const blob = await feeSettlementApi.export(classeChoisie, academicYearId)
      const classe = classes.find((c) => c.id === classeChoisie)?.name ?? "classe"
      downloadBlob(blob, `soldes-${classe}.xlsx`)
    } catch (err) {
      toast.error("Le tableau n'a pas pu être exporté", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setExporting(false)
    }
  }

  if (chargementDroits) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  if (!peutConsoliderLesCaisses) {
    return (
      <div className="p-4 md:p-6">
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Lock aria-hidden className="h-8 w-8 text-muted-foreground/50" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Ce tableau ne vous est pas ouvert</p>
              <p className="text-sm text-muted-foreground">
                Il dit ce que chaque famille doit encore, ce qui se calcule sur l&apos;argent reçu
                à toutes les caisses. Réduit à la vôtre, il annoncerait une dette chez des
                familles qui ont payé à un autre guichet.
              </p>
              <p className="text-sm text-muted-foreground">
                Votre journal des versements, lui, reste accessible sous{" "}
                <span className="font-medium">Paiements</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const soldes = data?.settled_count ?? 0
  const effectif = data?.total_count ?? 0

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHero
        icon={Wallet}
        title="Soldes par catégorie"
        subtitle="Où en est chaque famille, catégorie de frais par catégorie de frais"
        actions={
          <button
            type="button"
            className={heroAccentBtn}
            onClick={exporter}
            disabled={exporting || !data || effectif === 0}
          >
            <Download aria-hidden className="mr-1.5 h-4 w-4" />
            {exporting ? "Export…" : "Exporter"}
          </button>
        }
        kpis={[
          {
            label: "Élèves en règle",
            value: data ? `${soldes} / ${effectif}` : "—",
            icon: Wallet,
            hint: "Plus rien dû, dépôts en nature compris",
          },
        ]}
      />

      <AcademicYearScopeBar
        years={years}
        selectedYearId={academicYearId}
        onSelect={setPickedYearId}
        isLoading={loadingYears}
        selectId="settlement-academic-year"
        currentHelper="Le tableau porte sur cette année. Une inscription d'un autre exercice n'y figure pas."
        offYearWarning={
          `Ce n'est pas l'année en cours${currentYear ? ` (${currentYear.name})` : ""}. ` +
          "Les soldes ci-dessous ne parlent plus de l'exercice actuel."
        }
      />

      <ClassSelect
        id="settlement-class"
        classes={classes}
        value={classeChoisie}
        onChange={setClassId}
        isLoading={classesLoading}
        isError={classesEnErreur}
      />

      {isError ? (
        <DataError error={error ?? undefined} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : !data || data.rows.length === 0 ? (
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucune inscription dans cette classe pour cette année.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <SettlementTable matrix={data} />
          </div>
          <div className="space-y-2 md:hidden">
            {data.rows.map((row) => (
              <SettlementStudentCard key={row.enrollment_id} row={row} columns={data.columns} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
