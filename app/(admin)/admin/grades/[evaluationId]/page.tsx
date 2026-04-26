import type { Route } from "next"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GradeEntryGrid } from "@/components/teacher/grades/GradeEntryGrid"

interface AdminGradeEntryPageProps {
  params: Promise<{ evaluationId: string }>
  searchParams: Promise<{ classId?: string }>
}

/**
 * Saisie des notes en mode admin (délégation pour un prof). Réutilise le
 * composant GradeEntryGrid v2 du portail teacher — même UX premium pour les
 * deux personae, audit trail capturé via entered_by_user_id (migration 0019).
 *
 * classId vient en query param depuis le supervisor pour permettre au
 * composant de fetcher les métadonnées de l'éval (nom, matière, classe,
 * trimestre) via useEvaluations(classId) — cache TanStack Query partagé.
 */
export default async function AdminGradeEntryPage({
  params,
  searchParams,
}: AdminGradeEntryPageProps) {
  const { evaluationId } = await params
  const { classId } = await searchParams

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 h-8 self-start text-muted-foreground hover:text-foreground"
      >
        <Link href={"/admin/grades" as Route}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour à la supervision
        </Link>
      </Button>

      {/* Banner délégation — saisie au nom du prof titulaire. L'audit trail
          (entered_by_user_id) capture qui saisit côté BE. */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium">Saisie déléguée</p>
          <p className="text-xs text-amber-800/80">
            Vous saisissez les notes au nom de l&apos;enseignant titulaire. L&apos;audit
            système enregistre votre intervention pour traçabilité.
          </p>
        </div>
      </div>

      <GradeEntryGrid
        evaluationId={Number(evaluationId)}
        classId={classId ? Number(classId) : undefined}
      />
    </div>
  )
}
