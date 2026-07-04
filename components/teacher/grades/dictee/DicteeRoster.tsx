"use client"

import { cn } from "@/lib/utils"
import { entryToneClass, formatEntry, type EntryValue } from "./types"

interface RosterStudent {
  student_id: number
  student_name: string
}

interface DicteeRosterProps {
  students: RosterStudent[]
  entries: Map<number, EntryValue>
  currentIdx: number
  filledCount: number
  onJump: (idx: number) => void
  className?: string
}

/**
 * Panneau roster — vue live de toute la classe à droite en desktop. Remplit
 * l'espace horizontal (avant vide sur grand écran), permet de sauter
 * directement à un élève, et montre l'avancement d'un coup d'œil. Masqué en
 * mobile (le récap plein écran joue ce rôle sur petit écran).
 */
export function DicteeRoster({
  students,
  entries,
  currentIdx,
  filledCount,
  onJump,
  className,
}: DicteeRosterProps) {
  return (
    <aside
      className={cn(
        "flex w-[340px] shrink-0 flex-col border-l border-white/10 bg-white/[0.02]",
        className,
      )}
    >
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Classe
        </p>
        <p className="mt-0.5 text-sm text-white/80">
          {filledCount} / {students.length} saisis
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {students.map((s, idx) => {
          const v = entries.get(s.student_id)
          const isCurrent = idx === currentIdx
          return (
            <button
              type="button"
              key={s.student_id}
              onClick={() => onJump(idx)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                isCurrent
                  ? "border-accent/60 bg-accent/15"
                  : "border-transparent hover:bg-white/[0.06]",
              )}
              aria-current={isCurrent ? "true" : undefined}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] tabular-nums",
                  isCurrent ? "bg-accent text-accent-foreground" : "bg-white/10 text-white/70",
                )}
              >
                {idx + 1}
              </span>
              <span className="flex-1 truncate text-sm text-white/85">
                {s.student_name}
              </span>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  entryToneClass(v),
                )}
              >
                {formatEntry(v)}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
