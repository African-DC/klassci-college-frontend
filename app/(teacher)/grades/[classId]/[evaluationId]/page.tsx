"use client"

import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GradeEntryGrid } from "@/components/teacher/grades/GradeEntryGrid"

export default function GradeEntryPage() {
  const params = useParams<{ classId: string; evaluationId: string }>()
  const evaluationId = Number(params.evaluationId)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={`/teacher/grades` as never}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Saisie des notes</h1>
          <p className="text-sm text-muted-foreground">
            Classe {params.classId} — Evaluation #{params.evaluationId}
          </p>
        </div>
      </div>

      <GradeEntryGrid evaluationId={evaluationId} />
    </div>
  )
}
