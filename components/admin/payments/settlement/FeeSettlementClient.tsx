"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Download, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { PageHero, heroAccentBtn } from "@/components/shared/PageHero"
import { AcademicYearScopeBar } from "@/components/shared/AcademicYearScopeBar"
import { SettlementStudentCard } from "@/components/admin/payments/settlement/SettlementStudentCard"
import { SettlementTable } from "@/components/admin/payments/settlement/SettlementTable"
import { feeSettlementApi } from "@/lib/api/fee-settlement"
import { useClasses } from "@/lib/hooks/useClasses"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
import { useFeeSettlement } from "@/lib/hooks/useFeeSettlement"
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
  const [pickedYearId, setPickedYearId] = useState<number | undefined>(undefined)
  const { academicYearId, years, isLoading: loadingYears } = useCurrentAcademicYearId(pickedYearId)
  const currentYear = years?.find((y) => y.is_current)

  const { data: classesData, isLoading: classesLoading } = useClasses({ size: 200 })
  const classes = useMemo(
    () => [...(classesData?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [classesData],
  )
  const [classId, setClassId] = useState<number | undefined>(undefined)
  const classeChoisie = classId ?? classes[0]?.id

  const { data, isLoading, isError, refetch } = useFeeSettlement(classeChoisie, academicYearId)
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

  const soldes = data?.settled_count ?? 0
  const effectif = data?.total_count ?? 0

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHero
        icon={Wallet}
        title="Soldes par catégorie"
        subtitle="Qui a réglé quoi, et par quel moyen, sur une classe entière"
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

      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4">
          <Label htmlFor="settlement-class" className="text-xs text-muted-foreground">
            Classe
          </Label>
          <Select
            value={classeChoisie ? String(classeChoisie) : undefined}
            onValueChange={(v) => setClassId(Number(v))}
            disabled={classesLoading || classes.length === 0}
          >
            <SelectTrigger id="settlement-class" className="mt-1 h-11 sm:h-10">
              <SelectValue placeholder="Choisir une classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((classe) => (
                <SelectItem key={classe.id} value={String(classe.id)}>
                  {classe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isError ? (
        <DataError onRetry={() => refetch()} />
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
