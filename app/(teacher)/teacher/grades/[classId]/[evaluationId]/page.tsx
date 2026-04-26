import type { Route } from "next"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GradeEntryGrid } from "@/components/teacher/grades/GradeEntryGrid"

interface GradeEntryPageProps {
  params: Promise<{ classId: string; evaluationId: string }>
}

export default async function GradeEntryPage({ params }: GradeEntryPageProps) {
  const { classId, evaluationId } = await params

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 h-8 self-start text-muted-foreground hover:text-foreground"
      >
        <Link href={`/teacher/grades` as Route}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour à mes évaluations
        </Link>
      </Button>

      <GradeEntryGrid evaluationId={Number(evaluationId)} classId={Number(classId)} />
    </div>
  )
}
