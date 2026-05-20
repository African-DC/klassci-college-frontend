"use client"

import { ChevronRight, GraduationCap, Pencil, Trash2, UserX } from "lucide-react"
import type { Subject } from "@/lib/contracts/subject"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSubjectColor, teacherInitials } from "@/lib/utils/subject-colors"

export interface SubjectGroup {
  name: string
  catalogue: Subject | null
  instances: Subject[]
  totalHours: number
}

interface Props {
  group: SubjectGroup
  expanded: boolean
  onToggle: () => void
  onEdit: (id: number) => void
  onDelete: (subject: Subject) => void
}

// Layout grid réutilisé entre header et instance rows pour alignement parfait.
const GRID_COLS = "grid-cols-[36px_minmax(0,2fr)_72px_96px_minmax(0,1.6fr)_104px]"

export function SubjectGroupRow({ group, expanded, onToggle, onEdit, onDelete }: Props) {
  const color = getSubjectColor(group.catalogue?.color)
  const hasInstances = group.instances.length > 0
  const catalogue = group.catalogue

  return (
    <li className="border-b last:border-b-0">
      {/* Catalogue header row */}
      <div
        role={hasInstances ? "button" : undefined}
        tabIndex={hasInstances ? 0 : undefined}
        onClick={hasInstances ? onToggle : undefined}
        onKeyDown={
          hasInstances
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onToggle()
                }
              }
            : undefined
        }
        className={`grid ${GRID_COLS} items-center gap-3 px-4 py-3.5 transition-colors ${
          hasInstances ? "cursor-pointer hover:bg-muted/40" : "cursor-default"
        }`}
      >
        <div className="flex items-center justify-center">
          {hasInstances ? (
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          ) : (
            <span className="text-muted-foreground/30">—</span>
          )}
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.badge}`} aria-hidden />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{group.name}</div>
            <div className="text-xs text-muted-foreground">
              {hasInstances ? (
                <>
                  Catalogue · {group.instances.length}{" "}
                  {group.instances.length === 1 ? "instance" : "instances"}
                </>
              ) : (
                "Catalogue seul"
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          {catalogue && (
            <Badge variant="secondary" className="font-mono tabular-nums">
              {catalogue.coefficient}
            </Badge>
          )}
        </div>

        <div className="text-center tabular-nums text-sm">
          {catalogue ? (
            <>
              <span className="font-medium">{catalogue.hours_per_week}h</span>
              {hasInstances && (
                <div className="text-[10px] text-muted-foreground">{group.totalHours}h total</div>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>

        <div>
          <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wide">
            Catalogue
          </Badge>
        </div>

        <div
          className="flex justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {catalogue && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Modifier ${group.name}`}
                onClick={() => onEdit(catalogue.id)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Supprimer ${group.name}`}
                onClick={() => onDelete(catalogue)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Instance rows */}
      {expanded && hasInstances && (
        <ul className="border-t bg-muted/15">
          {group.instances.map((inst) => (
            <li
              key={inst.id}
              className={`grid ${GRID_COLS} items-center gap-3 px-4 py-2.5 border-t border-border/40 first:border-t-0`}
            >
              <div className="flex items-center justify-center text-muted-foreground/50 text-base leading-none">
                └
              </div>

              <div className="flex items-center gap-2 pl-3 min-w-0">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{inst.level_name ?? "—"}</span>
                {inst.series_name && (
                  <Badge variant="outline" className="text-[10px]">
                    Série {inst.series_name}
                  </Badge>
                )}
              </div>

              <div className="text-center">
                <Badge variant="secondary" className="font-mono tabular-nums">
                  {inst.coefficient}
                </Badge>
              </div>

              <div className="text-center tabular-nums text-sm font-medium">
                {inst.hours_per_week}h
              </div>

              <div className="min-w-0">
                {inst.teacher_name ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${color.badge}`}
                      aria-hidden
                    >
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

              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Modifier ${group.name} ${inst.level_name ?? ""}`}
                  onClick={() => onEdit(inst.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Supprimer ${group.name} ${inst.level_name ?? ""}`}
                  onClick={() => onDelete(inst)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export { GRID_COLS as SUBJECT_GRID_COLS }
