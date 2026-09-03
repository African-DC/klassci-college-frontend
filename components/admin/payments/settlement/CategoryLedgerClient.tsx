"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Package, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { PageHero, heroAccentBtn } from "@/components/shared/PageHero"
import { AcademicYearScopeBar } from "@/components/shared/AcademicYearScopeBar"
import { LedgerFilters } from "@/components/admin/payments/settlement/LedgerFilters"
import { LedgerCards, LedgerTable } from "@/components/admin/payments/settlement/LedgerRows"
import { feeCategoryLedgerApi } from "@/lib/api/fee-category-ledger"
import { useClassChoice } from "@/lib/hooks/useClassChoice"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
import { useFeeCategories } from "@/lib/hooks/useFees"
import { useFeeCategoryLedger } from "@/lib/hooks/useFeeCategoryLedger"
import { downloadBlob } from "@/lib/utils"

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} F`

/**
 * Le point sur une catégorie de frais.
 *
 * L'application regardait un élève, ou une classe. Elle ne savait pas regarder
 * **un frais** — et c'est ce qu'on demande quand un article vient d'un
 * prestataire : combien envoyer au fournisseur, et combien d'articles doivent
 * se retrouver en stock. Sur une scolarité, les mêmes colonnes disent combien
 * est rentré sur le mois et qui n'a pas encore payé.
 *
 * **Ce qui est entré se cloisonne ; ce qui reste dû ne se cloisonne pas.** Une
 * caissière lit ce qu'elle a encaissé : c'est un fait sur sa caisse. Ce qu'une
 * famille doit encore se calcule sur tout l'argent reçu — filtré sur un
 * guichet, il annoncerait une dette chez quelqu'un qui a payé à côté. L'écran
 * le dit, et n'affiche alors aucun impayé plutôt qu'un faux.
 */
export function CategoryLedgerClient() {
  const [pickedYearId, setPickedYearId] = useState<number | undefined>(undefined)
  const { academicYearId, years, isLoading: loadingYears } = useCurrentAcademicYearId(pickedYearId)
  const currentYear = years?.find((y) => y.is_current)

  const { data: categories, isLoading: loadingCategories } = useFeeCategories()
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)

  const { classes, isLoading: loadingClasses } = useClassChoice()
  const [classId, setClassId] = useState<number | undefined>(undefined)

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const criteres = {
    categoryId,
    academicYearId,
    classId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }
  const { data, isLoading, isError, error, refetch } = useFeeCategoryLedger(criteres)
  const [exporting, setExporting] = useState(false)

  async function exporter() {
    if (!categoryId || !academicYearId) return
    setExporting(true)
    try {
      const blob = await feeCategoryLedgerApi.export({
        ...criteres,
        categoryId,
        academicYearId,
      })
      const nom = data?.category_name?.replace(/[^\w-]+/g, "-").toLowerCase() ?? "categorie"
      downloadBlob(blob, `point-${nom}.xlsx`)
    } catch (err) {
      toast.error("Le document n'a pas pu être exporté", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setExporting(false)
    }
  }

  const kpis = [
    {
      label: "Entré en argent",
      value: data ? fmt(data.total_en_argent) : "—",
      icon: Wallet,
      hint: data ? `${data.eleves_en_argent} élèves sur la période` : "Choisissez un frais",
    },
    ...(data?.accepts_in_kind
      ? [
          {
            label: "Déposé en nature",
            value: data ? String(data.depots_en_nature) : "—",
            icon: Package,
            // Un depot vaut une ligne de frais remise. Parler de « paquets »
            // promettrait un decompte que la base ne tient pas.
            hint: "dépôts enregistrés sur la période",
          },
        ]
      : []),
    ...(data?.consolide
      ? [
          {
            label: "Reste à payer",
            value: data.total_restant_du !== null ? fmt(data.total_restant_du) : "—",
            icon: Wallet,
            hint: `${data.eleves_restant_du ?? 0} élèves, à aujourd'hui`,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHero
        icon={Wallet}
        title="Point par catégorie de frais"
        subtitle="Ce qui est entré, ce qui a été déposé, et qui doit encore"
        actions={
          <button
            type="button"
            className={heroAccentBtn}
            onClick={exporter}
            disabled={exporting || !data || data.lignes.length === 0}
          >
            <Download aria-hidden className="mr-1.5 h-4 w-4" />
            {exporting ? "Export…" : "Exporter"}
          </button>
        }
        kpis={kpis}
      />

      <AcademicYearScopeBar
        years={years}
        selectedYearId={academicYearId}
        onSelect={setPickedYearId}
        isLoading={loadingYears}
        selectId="ledger-academic-year"
        currentHelper="Le document porte sur cette année. Une inscription d'un autre exercice n'y figure pas."
        offYearWarning={
          `Ce n'est pas l'année en cours${currentYear ? ` (${currentYear.name})` : ""}. ` +
          "Les totaux ci-dessous ne parlent plus de l'exercice actuel."
        }
      />

      <LedgerFilters
        categories={categories ?? []}
        categoriesLoading={loadingCategories}
        categoryId={categoryId}
        onCategory={setCategoryId}
        classes={classes}
        classId={classId}
        onClass={setClassId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPeriod={({ from, to }) => {
          if (from !== undefined) setDateFrom(from)
          if (to !== undefined) setDateTo(to)
        }}
      />

      {data && !data.consolide && (
        // Dit avant le tableau, pas apres : quelqu'un qui lit les totaux du
        // haut doit savoir tout de suite qu'ils ne couvrent que sa caisse.
        <Card className="border-0 shadow-sm ring-1 ring-amber-500/40">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Ce document ne couvre que votre caisse
            </p>
            <p className="mt-1 text-muted-foreground">
              Il dit ce que vous avez encaissé sur ce frais, et rien de ce qui a été encaissé
              ailleurs. Le reste à payer n'y figure donc pas : le calculer sur une seule caisse
              annoncerait une dette chez des familles qui ont payé à un autre guichet.
            </p>
          </CardContent>
        </Card>
      )}

      {!categoryId ? (
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Choisissez une catégorie de frais pour voir où en est chaque famille.
          </CardContent>
        </Card>
      ) : isError ? (
        <DataError error={error ?? undefined} onRetry={() => refetch()} />
      ) : isLoading || loadingClasses ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : !data || data.lignes.length === 0 ? (
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucune inscription ne porte ce frais sur ce périmètre.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <LedgerTable ledger={data} />
          </div>
          <div className="md:hidden">
            <LedgerCards ledger={data} />
          </div>
        </>
      )}
    </div>
  )
}
