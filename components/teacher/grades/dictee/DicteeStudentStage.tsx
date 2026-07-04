"use client"

import { cn } from "@/lib/utils"
import type { EntryValue } from "./types"

interface DicteeStudentStageProps {
  studentName: string
  position: number
  total: number
  value: EntryValue
  subjectLabel?: string
  feedback: "ok" | "error" | null
  transcript: string
  interim: string
}

/**
 * Scène centrale de la dictée : élève courant + grande note lisible plein
 * soleil (text-8xl/9xl). Occupe tout l'espace vertical disponible. Responsive :
 * la note grossit encore sur desktop pour remplir la colonne principale.
 */
export function DicteeStudentStage({
  studentName,
  position,
  total,
  value,
  subjectLabel,
  feedback,
  transcript,
  interim,
}: DicteeStudentStageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
          Élève {position} sur {total}
        </p>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
          {studentName}
        </h1>
        {subjectLabel && <p className="text-sm text-white/60">{subjectLabel}</p>}
      </div>

      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-3xl border px-10 py-8 transition-colors",
          feedback === "ok" && "border-emerald-400/40 bg-emerald-400/5",
          feedback === "error" && "border-rose-400/40 bg-rose-400/5",
          !feedback && "border-white/10 bg-white/[0.03]",
        )}
      >
        {value === undefined ? (
          <span className="text-7xl font-bold text-white/20 sm:text-8xl lg:text-9xl">—</span>
        ) : value === null ? (
          <span className="text-5xl font-bold text-amber-300 sm:text-6xl lg:text-7xl">
            ABSENT
          </span>
        ) : (
          <span className="text-7xl font-bold tabular-nums text-white sm:text-8xl lg:text-9xl">
            {Number.isInteger(value) ? value : value.toString().replace(".", ",")}
          </span>
        )}
        <span className="text-sm text-white/50">/ 20</span>
      </div>

      {transcript ? (
        <p className="max-w-md text-sm italic text-white/60">« {transcript} »</p>
      ) : interim ? (
        <p className="max-w-md text-sm italic text-white/40">… {interim}</p>
      ) : null}
    </div>
  )
}
