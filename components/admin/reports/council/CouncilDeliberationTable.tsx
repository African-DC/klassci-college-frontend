"use client"

import { useState, useMemo } from "react"
import { Save, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CouncilDecisionBadge } from "./CouncilDecisionBadge"
import { CouncilValidateButton } from "./CouncilValidateButton"
import { useUpdateDecisions } from "@/lib/hooks/useCouncil"
import type { CouncilMinutes, CouncilDecision, CouncilDecisionUpdate } from "@/lib/contracts/council"

// Calcul automatique de la décision basé sur la MGA (système ivoirien)
function computeAutoDecision(average: number | null): CouncilDecision | null {
  if (average === null) return null
  if (average >= 10) return "passage"
  if (average >= 9.5) return "repechage"
  if (average >= 8.5) return "redoublement"
  return "exclusion"
}

interface CouncilDeliberationTableProps {
  minutes: CouncilMinutes
}

export function CouncilDeliberationTable({ minutes }: CouncilDeliberationTableProps) {
  const isReadOnly = minutes.status === "valide"
  const { mutate: saveDecisions, isPending: isSaving } = useUpdateDecisions()

  // État local des décisions modifiées
  const [localDecisions, setLocalDecisions] = useState<
    Map<number, { decision: CouncilDecision; reason: string | null }>
  >(new Map())

  // Récupère la décision courante (locale si modifiée, sinon celle du serveur)
  function getCurrentDecision(studentId: number): CouncilDecision | null {
    return localDecisions.get(studentId)?.decision ??
      minutes.records.find((r) => r.student_id === studentId)?.final_decision ?? null
  }

  function getCurrentReason(studentId: number): string | null {
    return localDecisions.get(studentId)?.reason ??
      minutes.records.find((r) => r.student_id === studentId)?.override_reason ?? null
  }

  // Modifier la décision d'un élève
  function handleDecisionChange(studentId: number, decision: CouncilDecision) {
    setLocalDecisions((prev) => {
      const next = new Map(prev)
      const record = minutes.records.find((r) => r.student_id === studentId)
      const autoDecision = record ? computeAutoDecision(record.average) : null
      // Si la décision est identique à l'auto, pas besoin de raison
      const needsReason = decision !== autoDecision
      next.set(studentId, {
        decision,
        reason: needsReason ? (getCurrentReason(studentId) ?? "") : null,
      })
      return next
    })
  }

  function handleReasonChange(studentId: number, reason: string) {
    setLocalDecisions((prev) => {
      const next = new Map(prev)
      const existing = next.get(studentId)
      if (existing) {
        next.set(studentId, { ...existing, reason })
      }
      return next
    })
  }

  // Enregistrer les décisions modifiées
  function handleSave() {
    const decisions: CouncilDecisionUpdate[] = []
    for (const [studentId, { decision, reason }] of localDecisions) {
      decisions.push({
        student_id: studentId,
        final_decision: decision,
        override_reason: reason,
      })
    }
    if (decisions.length === 0) return
    saveDecisions(
      { minutesId: minutes.id, decisions },
      { onSuccess: () => setLocalDecisions(new Map()) },
    )
  }

  // Statistiques de synthèse
  const stats = useMemo(() => {
    const counts = { passage: 0, repechage: 0, redoublement: 0, exclusion: 0, pending: 0 }
    for (const record of minutes.records) {
      const decision = localDecisions.get(record.student_id)?.decision ?? record.final_decision
      if (decision) {
        counts[decision]++
      } else {
        counts.pending++
      }
    }
    return counts
  }, [minutes.records, localDecisions])

  const hasChanges = localDecisions.size > 0

  return (
    <div className="space-y-4">
      {/* Synthèse */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Passage" count={stats.passage} className="text-emerald-600" />
        <StatCard label="Repêchage" count={stats.repechage} className="text-amber-600" />
        <StatCard label="Redoublement" count={stats.redoublement} className="text-orange-600" />
        <StatCard label="Exclusion" count={stats.exclusion} className="text-rose-600" />
        <StatCard label="En attente" count={stats.pending} className="text-muted-foreground" />
      </div>

      {/* Tableau de délibération */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Élève</TableHead>
              <TableHead className="text-center">Moyenne</TableHead>
              <TableHead className="text-center">Rang</TableHead>
              <TableHead>Décision auto</TableHead>
              <TableHead>Décision finale</TableHead>
              {!isReadOnly && <TableHead>Motif (si différent)</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {minutes.records.map((record, index) => {
              const autoDecision = computeAutoDecision(record.average)
              const finalDecision = getCurrentDecision(record.student_id)
              const reason = getCurrentReason(record.student_id)
              const isOverridden = finalDecision !== null && finalDecision !== autoDecision

              return (
                <TableRow
                  key={record.id}
                  className={isOverridden ? "bg-accent/5" : undefined}
                >
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{record.student_name}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {record.average !== null ? record.average.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {record.rank ?? "—"}/{record.total_students}
                  </TableCell>
                  <TableCell>
                    <CouncilDecisionBadge decision={autoDecision} />
                  </TableCell>
                  <TableCell>
                    {isReadOnly ? (
                      <CouncilDecisionBadge decision={finalDecision} />
                    ) : (
                      <Select
                        value={finalDecision ?? ""}
                        onValueChange={(v) =>
                          handleDecisionChange(record.student_id, v as CouncilDecision)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passage">Passage</SelectItem>
                          <SelectItem value="repechage">Repêchage</SelectItem>
                          <SelectItem value="redoublement">Redoublement</SelectItem>
                          <SelectItem value="exclusion">Exclusion</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      {isOverridden && (
                        <Input
                          placeholder="Motif de la modification..."
                          value={reason ?? ""}
                          onChange={(e) =>
                            handleReasonChange(record.student_id, e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Enregistrement..." : "Enregistrer les décisions"}
            </Button>
          )}
          <CouncilValidateButton
            minutesId={minutes.id}
            disabled={isReadOnly || stats.pending > 0}
          />
        </div>
        <Button variant="outline" asChild>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/council-minutes/${minutes.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </a>
        </Button>
      </div>
    </div>
  )
}

// Carte de statistique compacte
function StatCard({
  label,
  count,
  className,
}: {
  label: string
  count: number
  className?: string
}) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className={`text-xl font-bold ${className ?? ""}`}>{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
