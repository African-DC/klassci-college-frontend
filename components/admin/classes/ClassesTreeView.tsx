"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  GraduationCap,
  BookOpen,
  School,
  ChevronRight,
  ChevronDown,
  Users,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import { useLevels } from "@/lib/hooks/useLevels"
import { useSeriesList } from "@/lib/hooks/useSeries"
import { useClasses, useDeleteClass } from "@/lib/hooks/useClasses"
import type { Class } from "@/lib/contracts/class"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClassEditModal } from "./ClassEditModal"

interface TreeNode {
  type: "level" | "series" | "class"
  id: number
  name: string
  children?: TreeNode[]
  classData?: Class
}

export function ClassesTreeView() {
  const router = useRouter()
  const { data: levelsData, isLoading: levelsLoading } = useLevels({ size: 100 })
  const { data: seriesData, isLoading: seriesLoading } = useSeriesList({ size: 200 })
  const { data: classesData, isLoading: classesLoading } = useClasses({ size: 500 })
  const deleteMutation = useDeleteClass()

  const [expanded, setExpanded] = useState<Set<string>>(new Set(["all"]))
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  const isLoading = levelsLoading || seriesLoading || classesLoading

  // Build tree: Level > Series > Classes
  const tree = useMemo(() => {
    if (!levelsData?.items || !classesData?.items) return []

    const levels = levelsData.items
    const series = seriesData?.items ?? []
    const classes = classesData.items

    // Group classes by level_id and series_id
    const classesByLevel = new Map<number, Class[]>()
    const classesByLevelSeries = new Map<string, Class[]>()

    for (const c of classes) {
      if (c.series_id) {
        const key = `${c.level_id}-${c.series_id}`
        if (!classesByLevelSeries.has(key)) classesByLevelSeries.set(key, [])
        classesByLevelSeries.get(key)!.push(c)
      } else {
        if (!classesByLevel.has(c.level_id)) classesByLevel.set(c.level_id, [])
        classesByLevel.get(c.level_id)!.push(c)
      }
    }

    const nodes: TreeNode[] = levels
      .sort((a, b) => a.order - b.order)
      .map((level) => {
        const levelSeries = series.filter((s) => s.level_id === level.id)
        const children: TreeNode[] = []

        // Add series with their classes
        for (const s of levelSeries) {
          const key = `${level.id}-${s.id}`
          const seriesClasses = classesByLevelSeries.get(key) ?? []
          children.push({
            type: "series",
            id: s.id,
            name: s.name,
            children: seriesClasses.map((c) => ({
              type: "class",
              id: c.id,
              name: c.name,
              classData: c,
            })),
          })
        }

        // Add classes without series (direct under level)
        const directClasses = classesByLevel.get(level.id) ?? []
        for (const c of directClasses) {
          children.push({
            type: "class",
            id: c.id,
            name: c.name,
            classData: c,
          })
        }

        return {
          type: "level" as const,
          id: level.id,
          name: level.name,
          children,
        }
      })

    return nodes
  }, [levelsData, seriesData, classesData])

  // Auto-expand all on first load
  useMemo(() => {
    if (tree.length > 0 && expanded.size <= 1) {
      const allKeys = new Set(["all"])
      for (const level of tree) {
        allKeys.add(`level-${level.id}`)
        for (const child of level.children ?? []) {
          if (child.type === "series") {
            allKeys.add(`series-${child.id}`)
          }
        }
      }
      setExpanded(allKeys)
    }
  }, [tree])

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Aucun niveau configuré. Créez des niveaux dans "Niveaux & Séries" d'abord.
      </div>
    )
  }

  // Total classes count
  const totalClasses = classesData?.items?.length ?? 0
  const totalStudents = classesData?.items?.reduce((sum, c) => sum + (c.enrolled_count ?? 0), 0) ?? 0

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{totalClasses} classes</span>
        <span className="text-border">|</span>
        <span>{totalStudents} élèves inscrits</span>
      </div>

      {/* Tree */}
      <div className="rounded-lg border bg-card">
        {tree.map((levelNode) => (
          <LevelRow
            key={levelNode.id}
            node={levelNode}
            expanded={expanded}
            onToggle={toggleExpand}
            onClickClass={(id) => router.push(`/admin/classes/${id}`)}
            onEditClass={setEditId}
            onDeleteClass={(id, name) => setDeleteTarget({ id, name })}
          />
        ))}
      </div>

      {/* Edit modal */}
      <ClassEditModal
        classId={editId}
        open={editId !== null}
        onClose={() => setEditId(null)}
      />

      {/* Delete dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la classe</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La classe "{deleteTarget?.name}" sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  })
                }
              }}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tree row components
// ---------------------------------------------------------------------------

function LevelRow({
  node,
  expanded,
  onToggle,
  onClickClass,
  onEditClass,
  onDeleteClass,
}: {
  node: TreeNode
  expanded: Set<string>
  onToggle: (key: string) => void
  onClickClass: (id: number) => void
  onEditClass: (id: number) => void
  onDeleteClass: (id: number, name: string) => void
}) {
  const key = `level-${node.id}`
  const isExpanded = expanded.has(key)
  const childCount = node.children?.length ?? 0
  const classCount = countClasses(node)

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b"
        onClick={() => onToggle(key)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
        <span className="font-semibold text-base">{node.name}</span>
        <Badge variant="secondary" className="ml-2 text-xs">
          {classCount} classe{classCount !== 1 ? "s" : ""}
        </Badge>
      </button>

      {isExpanded && node.children && (
        <div className="bg-muted/20">
          {node.children.map((child) =>
            child.type === "series" ? (
              <SeriesRow
                key={`series-${child.id}`}
                node={child}
                expanded={expanded}
                onToggle={onToggle}
                onClickClass={onClickClass}
                onEditClass={onEditClass}
                onDeleteClass={onDeleteClass}
              />
            ) : (
              <ClassRow
                key={`class-${child.id}`}
                node={child}
                depth={1}
                onClickClass={onClickClass}
                onEditClass={onEditClass}
                onDeleteClass={onDeleteClass}
              />
            ),
          )}
          {childCount === 0 && (
            <div className="px-12 py-3 text-sm text-muted-foreground italic">
              Aucune classe dans ce niveau
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SeriesRow({
  node,
  expanded,
  onToggle,
  onClickClass,
  onEditClass,
  onDeleteClass,
}: {
  node: TreeNode
  expanded: Set<string>
  onToggle: (key: string) => void
  onClickClass: (id: number) => void
  onEditClass: (id: number) => void
  onDeleteClass: (id: number, name: string) => void
}) {
  const key = `series-${node.id}`
  const isExpanded = expanded.has(key)
  const classCount = node.children?.length ?? 0

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-3 pl-10 pr-4 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/50"
        onClick={() => onToggle(key)}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <BookOpen className="h-4 w-4 shrink-0 text-accent" />
        <span className="font-medium text-sm">Série {node.name}</span>
        <span className="text-xs text-muted-foreground ml-1">({classCount})</span>
      </button>

      {isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <ClassRow
              key={`class-${child.id}`}
              node={child}
              depth={2}
              onClickClass={onClickClass}
              onEditClass={onEditClass}
              onDeleteClass={onDeleteClass}
            />
          ))}
          {classCount === 0 && (
            <div className="pl-20 py-2.5 text-sm text-muted-foreground italic">
              Aucune classe dans cette série
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ClassRow({
  node,
  depth,
  onClickClass,
  onEditClass,
  onDeleteClass,
}: {
  node: TreeNode
  depth: number
  onClickClass: (id: number) => void
  onEditClass: (id: number) => void
  onDeleteClass: (id: number, name: string) => void
}) {
  const c = node.classData
  const enrolled = c?.enrolled_count ?? 0
  const max = c?.max_students ?? 0
  const ratio = max > 0 ? (enrolled / max) * 100 : 0
  const paddingLeft = depth === 1 ? "pl-14" : "pl-20"

  return (
    <div
      className={`group flex items-center gap-3 ${paddingLeft} pr-4 py-2.5 hover:bg-primary/5 cursor-pointer transition-colors border-b border-border/30`}
      onClick={() => onClickClass(node.id)}
    >
      <School className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-sm font-medium flex-1">{node.name}</span>

      {/* Enrolled count */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span className="font-mono">{enrolled}/{max || "—"}</span>
        {max > 0 && (
          <div className="w-16 h-1.5 rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${
                ratio > 95 ? "bg-rose-500" : ratio >= 80 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(ratio, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => { e.stopPropagation(); onEditClass(node.id) }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => { e.stopPropagation(); onDeleteClass(node.id, node.name) }}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

function countClasses(node: TreeNode): number {
  if (node.type === "class") return 1
  return (node.children ?? []).reduce((sum, child) => sum + countClasses(child), 0)
}
