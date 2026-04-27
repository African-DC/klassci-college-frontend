"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import type { Permission } from "@/lib/contracts/role"
import { cn } from "@/lib/utils"

/**
 * Two-level taxonomy of permission slugs.
 *
 * Slugs are `:`-separated. First segment = domain. For "admin" domain,
 * second segment = entity (students, teachers, ...). Last segment = action.
 *
 * Examples:
 *   admin:students:read    → domain="admin",  entity="students",     action="read"
 *   grades:write           → domain="grades", entity=null,           action="write"
 *   bulletins:generate     → domain="bulletins", entity=null,        action="generate"
 *   super-admin:tenants:create → domain="super-admin", entity="tenants", action="create"
 */
type ParsedSlug = {
  domain: string
  entity: string | null
  action: string
}

function parseSlug(slug: string): ParsedSlug {
  const parts = slug.split(":")
  if (parts.length >= 3) {
    return { domain: parts[0], entity: parts.slice(1, -1).join(":"), action: parts[parts.length - 1] }
  }
  if (parts.length === 2) {
    return { domain: parts[0], entity: null, action: parts[1] }
  }
  return { domain: parts[0] ?? slug, entity: null, action: "" }
}

const DOMAIN_LABELS: Record<string, string> = {
  admin: "Administration",
  grades: "Notes & évaluations",
  bulletins: "Bulletins",
  enrollments: "Inscriptions",
  payments: "Paiements",
  attendance: "Présences",
  timetable: "Emploi du temps",
  reports: "Rapports",
  "super-admin": "Super administration",
}

const ENTITY_LABELS: Record<string, string> = {
  students: "Étudiants",
  teachers: "Enseignants",
  staff: "Personnel",
  parents: "Parents / Tuteurs",
  classes: "Classes",
  subjects: "Matières",
  "academic-years": "Années scolaires",
  levels: "Niveaux",
  series: "Séries",
  rooms: "Salles",
  roles: "Rôles & permissions",
  "fee-categories": "Catégories de frais",
  "fee-variants": "Variantes de frais",
  "fee-options": "Options de frais",
  tenants: "Tenants",
}

const ACTION_LABELS: Record<string, string> = {
  read: "Voir",
  create: "Créer",
  update: "Modifier",
  write: "Modifier",
  delete: "Supprimer",
  generate: "Générer",
  override: "Forcer",
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

function entityLabel(entity: string | null, domain: string): string {
  if (!entity) return DOMAIN_LABELS[domain] ?? domain
  return ENTITY_LABELS[entity] ?? entity
}

interface PermissionMatrixProps {
  permissions: Permission[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

export function PermissionMatrix({ permissions, selectedIds, onChange }: PermissionMatrixProps) {
  const [search, setSearch] = useState("")

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  /**
   * Group permissions by domain → entity → list of perms.
   * Filter by search before grouping so empty groups don't render.
   */
  const grouped = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const map = new Map<string, Map<string | null, Permission[]>>()

    for (const perm of permissions) {
      if (
        needle &&
        !perm.slug.toLowerCase().includes(needle) &&
        !perm.name.toLowerCase().includes(needle)
      ) {
        continue
      }
      const { domain, entity } = parseSlug(perm.slug)
      let entities = map.get(domain)
      if (!entities) {
        entities = new Map()
        map.set(domain, entities)
      }
      const list = entities.get(entity) ?? []
      list.push(perm)
      entities.set(entity, list)
    }
    return map
  }, [permissions, search])

  function togglePermission(id: number) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((pid) => pid !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function toggleEntity(perms: Permission[]) {
    const ids = perms.map((p) => p.id)
    const allSelected = ids.every((id) => selectedSet.has(id))
    if (allSelected) {
      const removeSet = new Set(ids)
      onChange(selectedIds.filter((id) => !removeSet.has(id)))
    } else {
      onChange(Array.from(new Set([...selectedIds, ...ids])))
    }
  }

  function toggleDomain(entities: Map<string | null, Permission[]>) {
    const allPerms = Array.from(entities.values()).flat()
    toggleEntity(allPerms)
  }

  if (permissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Aucune permission disponible.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une permission..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      <div className="space-y-3 rounded-lg border p-3">
        {grouped.size === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune permission ne correspond à « {search} ».
          </p>
        )}

        {Array.from(grouped.entries()).map(([domain, entities]) => {
          const allPerms = Array.from(entities.values()).flat()
          const allIds = allPerms.map((p) => p.id)
          const allChecked = allIds.every((id) => selectedSet.has(id))
          const someChecked = !allChecked && allIds.some((id) => selectedSet.has(id))
          const checkedCount = allIds.filter((id) => selectedSet.has(id)).length

          // Default expanded only if (a) the domain has selected perms OR
          // (b) a search term narrows the result. Otherwise collapse — 9
          // domains × 5 entities × 4 actions = mur d'options sur mobile.
          const expandedByDefault = checkedCount > 0 || search.trim().length > 0

          return (
            <details key={domain} open={expandedByDefault} className="group">
              <summary className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                <Checkbox
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={() => toggleDomain(entities)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm font-semibold">
                  {DOMAIN_LABELS[domain] ?? domain}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({checkedCount}/{allIds.length})
                </span>
              </summary>

              <div className="mt-2 ml-6 space-y-1.5">
                {Array.from(entities.entries()).map(([entity, perms]) => {
                  // Sort perms by action so they always render in a consistent order:
                  // read, create, update, delete, generate, override.
                  const order = ["read", "create", "update", "write", "delete", "generate", "override"]
                  const sorted = [...perms].sort(
                    (a, b) =>
                      order.indexOf(parseSlug(a.slug).action) -
                      order.indexOf(parseSlug(b.slug).action),
                  )

                  return (
                    <div
                      key={`${domain}-${entity ?? "_"}`}
                      className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30"
                    >
                      <span className="min-w-0 flex-shrink-0 basis-full sm:basis-44 text-sm">
                        {entityLabel(entity, domain)}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sorted.map((perm) => {
                          const isChecked = selectedSet.has(perm.id)
                          const { action } = parseSlug(perm.slug)
                          return (
                            <button
                              type="button"
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              title={perm.description ?? perm.name}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors min-h-[28px]",
                                isChecked
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-muted bg-background text-muted-foreground hover:bg-muted/50",
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-block h-1.5 w-1.5 rounded-full",
                                  isChecked ? "bg-primary" : "bg-muted-foreground/30",
                                )}
                              />
                              {actionLabel(action)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
