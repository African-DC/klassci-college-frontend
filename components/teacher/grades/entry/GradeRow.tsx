"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { categorizeGrade } from "@/lib/utils/grade-parser"

export type CellStatus = "idle" | "dirty" | "pending" | "saved" | "error"

function formatGradeInput(value: number | null): string {
  return value !== null ? String(value).replace(".", ",") : ""
}

interface GradeRowProps {
  index: number
  studentName: string
  /** Valeur côté serveur — sert UNIQUEMENT à l'init de l'input (mode « Réviser »). */
  initialValue: number | null
  /** Valeur courante (serveur OU frappe locale en cours) — pour la catégorisation. */
  value: number | null
  status: CellStatus
  originalStatus: string
  onChange: (rawValue: string) => void
  /** Bordures de cellule dans la grille (mono-colonne mobile, 2 colonnes desktop). */
  className?: string
}

/**
 * Une ligne de saisie : rang + nom + input /20 avec catégorisation colorée
 * (difficulté / passable / bon / absent) et pastille de synchro. Touch h-12.
 */
export function GradeRow({
  index,
  studentName,
  initialValue,
  value,
  status,
  originalStatus,
  onChange,
  className,
}: GradeRowProps) {
  // rawInput = source de vérité de ce que l'utilisateur tape (états transitoires
  // « 12, »). Init UNE fois depuis le serveur, puis l'user contrôle.
  const [rawInput, setRawInput] = useState<string>(formatGradeInput(initialValue))

  useEffect(() => {
    if (status === "idle") {
      setRawInput(formatGradeInput(initialValue))
    }
  }, [initialValue, status])

  const category = categorizeGrade(value, originalStatus)
  const colorTone = useMemo(() => {
    switch (category) {
      case "difficulte":
        return { text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-900", bg: "bg-rose-50/60 dark:bg-rose-950/40", Icon: AlertTriangle, label: "En difficulté" }
      case "moyen":
        return { text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-900", bg: "bg-amber-50/60 dark:bg-amber-950/40", Icon: null, label: "Passable" }
      case "bon":
        return { text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-900", bg: "bg-emerald-50/60 dark:bg-emerald-950/40", Icon: CheckCircle2, label: "Bon" }
      case "absent":
        return { text: "text-muted-foreground", border: "border-muted", bg: "bg-muted/40", Icon: CircleSlash, label: "Absent" }
      case "non_saisi":
      default:
        return { text: "text-muted-foreground/60", border: "border-input", bg: "", Icon: null, label: "—" }
    }
  }, [category])

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
        status === "saved" && "bg-emerald-50/40 dark:bg-emerald-950/30",
        status === "error" && "bg-destructive/5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="w-7 shrink-0 font-mono text-xs text-muted-foreground/70">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="truncate text-sm font-medium">{studentName}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {category !== "non_saisi" && colorTone.Icon && (
          <span
            className={cn(
              "hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex",
              colorTone.bg,
              colorTone.text,
            )}
            title={colorTone.label}
          >
            <colorTone.Icon className="h-3 w-3" />
            {colorTone.label}
          </span>
        )}

        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[,.]?[0-9]*"
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value)
              onChange(e.target.value)
            }}
            placeholder="--"
            className={cn(
              "h-12 w-24 rounded-lg border-2 bg-background px-3 text-center text-base font-semibold tabular-nums transition-colors",
              "placeholder:font-normal placeholder:text-muted-foreground/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              status === "saved" && "border-emerald-400",
              status === "error" && "border-destructive",
              status === "pending" && "border-primary/60",
              (status === "idle" || status === "dirty") && colorTone.border,
              colorTone.text,
            )}
            aria-label={`Note de ${studentName} sur 20`}
          />
          <span className="pointer-events-none absolute -right-1 -top-1 text-[10px] text-muted-foreground/50">
            /20
          </span>
        </div>

        <div className="flex h-5 w-5 items-center justify-center">
          {status === "pending" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {status === "saved" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
          {status === "dirty" && <span className="h-2 w-2 rounded-full bg-amber-500" />}
        </div>
      </div>
    </div>
  )
}
