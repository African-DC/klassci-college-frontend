import { DicteeMode } from "@/components/teacher/grades/DicteeMode"

interface AdminDicteePageProps {
  params: Promise<{ evaluationId: string }>
  searchParams: Promise<{ classId?: string }>
}

export const metadata = { title: "Mode dictée — KLASSCI" }

/**
 * Mode dictée en saisie déléguée (admin). Réutilise le composant DicteeMode du
 * portail enseignant, mais revient vers la supervision admin à la sortie —
 * rester dans le portail /admin évite la redirection middleware vers le
 * tableau de bord (un admin ne peut pas atterrir sur /teacher/*).
 *
 * classId vient en query param depuis la page de saisie admin pour charger les
 * métadonnées de l'évaluation (nom, matière) via le cache TanStack Query.
 */
export default async function AdminDicteePage({
  params,
  searchParams,
}: AdminDicteePageProps) {
  const { evaluationId } = await params
  const { classId } = await searchParams

  return (
    <DicteeMode
      classId={classId ? Number(classId) : 0}
      evaluationId={Number(evaluationId)}
      returnHref={`/admin/grades/${evaluationId}${classId ? `?classId=${classId}` : ""}`}
    />
  )
}
