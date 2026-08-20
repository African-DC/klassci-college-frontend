"use client"

import { ChevronRight, GraduationCap, UserX } from "lucide-react"
import type { Subject } from "@/lib/contracts/subject"
import { Badge } from "@/components/ui/badge"
import { getSubjectColor, teacherInitials } from "@/lib/utils/subject-colors"
import { SubjectRowActions } from "./SubjectRowActions"
import type { SubjectGroup } from "@/lib/contracts/subject-group"

interface Props {
  group: SubjectGroup
  expanded: boolean
  onToggle: () => void
  onEdit: (id: number) => void
  onAssign: (catalogue: Subject) => void
  onDelete: (subject: Subject) => void
}

export function SubjectMobileCard({ group, expanded, onToggle, onEdit, onAssign, onDelete }: Props) {
  const color = getSubjectColor(group.catalogue?.color)
  const catalogue = group.catalogue
  const hasInstances = group.instances.length > 0

  return (
    <article className="rounded-lg border bg-card">
      <div className="flex items-start gap-3 p-3">
        {hasInstances ? (
          <button
            type="button"
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-muted"
            aria-expanded={expanded}
            aria-label={expanded ? `Replier ${group.name}` : `Déplier ${group.name}`}
            onClick={onToggle}
          >
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className={`mt-3 h-2.5 w-2.5 shrink-0 rounded-full ${color.badge}`} aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{group.name}</p>
              <p className="text-xs text-muted-foreground">
                {hasInstances
                  ? `Catalogue · ${group.instances.length} ${group.instances.length === 1 ? "instance" : "instances"}`
                  : "Catalogue seul"}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px] uppercase">Catalogue</Badge>
          </div>
          {catalogue && (
            <p className="mt-1 text-xs text-muted-foreground">
              Coef. {catalogue.coefficient} · {catalogue.hours_per_week}h/sem
              {hasInstances ? ` · ${group.totalHours}h total` : ""}
            </p>
          )}
          {catalogue && (
            <div className="mt-2">
              <SubjectRowActions
                name={group.name}
                size="mobile"
                onEdit={() => onEdit(catalogue.id)}
                onAssign={() => onAssign(catalogue)}
                onDelete={() => onDelete(catalogue)}
              />
            </div>
          )}
        </div>
      </div>

      {expanded && hasInstances && (
        <ul className="space-y-2 border-t bg-muted/15 p-3">
          {group.instances.map((inst) => (
            <li key={inst.id} className="rounded-md border bg-card p-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{inst.level_name ?? "-"}</span>
                {inst.series_name && (
                  <Badge variant="outline" className="text-[10px]">Série {inst.series_name}</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Coef. {inst.coefficient} · {inst.hours_per_week}h/sem
              </p>
              <div className="mt-2">
                {inst.teacher_name ? (
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ${color.badge}`}>
                      {teacherInitials(inst.teacher_name)}
                    </div>
                    <span className="truncate text-sm">{inst.teacher_name}</span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                    <UserX className="h-3 w-3" />
                    Non assigné
                  </span>
                )}
              </div>
              <div className="mt-2">
                <SubjectRowActions
                  name={`${group.name} ${inst.level_name ?? ""}`}
                  size="mobile"
                  onEdit={() => onEdit(inst.id)}
                  onDelete={() => onDelete(inst)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}