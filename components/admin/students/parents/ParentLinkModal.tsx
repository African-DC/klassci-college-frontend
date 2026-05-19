"use client"

import { useState } from "react"
import { Link2, Search, Phone, Mail, CheckCircle2 } from "lucide-react"
import { useParents, useLinkParent } from "@/lib/hooks/useParents"
import { useDebounce } from "@/lib/hooks/useDebounce"
import type { Parent } from "@/lib/contracts/parent"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { InitialsAvatar } from "../tabs/_primitives"
import { RELATIONSHIPS } from "./relationship"

interface ParentLinkModalProps {
  studentId: number
  open: boolean
  onClose: () => void
}

export function ParentLinkModal({ studentId, open, onClose }: ParentLinkModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<Parent | null>(null)
  const [relationship, setRelationship] = useState<string>("guardian")
  const debounced = useDebounce(searchQuery, 300)
  const { mutate: linkParent, isPending } = useLinkParent()

  const enabled = debounced.length >= 2
  const { data, isLoading } = useParents(enabled ? { search: debounced, size: 20 } : { size: 0 })
  const matches = enabled ? (data?.items ?? []) : []

  const handleClose = () => {
    setSearchQuery("")
    setSelected(null)
    setRelationship("guardian")
    onClose()
  }

  const handleConfirm = () => {
    if (!selected) return
    linkParent(
      { parentId: selected.id, studentId, relationshipType: relationship },
      { onSuccess: handleClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Link2 className="h-5 w-5 text-primary" />
            Lier un parent existant
          </DialogTitle>
          <DialogDescription>
            Recherchez un parent déjà enregistré pour l&apos;associer à cet élève.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nom, prénom, téléphone, email…"
              className="h-11 pl-9 sm:h-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelected(null)
              }}
              aria-label="Rechercher un parent existant"
            />
          </div>

          {/* Résultats */}
          {!enabled && (
            <p className="rounded-lg bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
              Tapez au moins 2 caractères pour rechercher.
            </p>
          )}

          {enabled && isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          )}

          {enabled && !isLoading && matches.length === 0 && (
            <div className="rounded-lg bg-muted/20 px-4 py-6 text-center">
              <p className="text-sm font-medium">Aucun parent trouvé</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aucun résultat pour «&nbsp;{debounced}&nbsp;». Créez un nouveau parent à la place.
              </p>
            </div>
          )}

          {matches.length > 0 && (
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {matches.map((p) => {
                const isSelected = selected?.id === p.id
                const fullName = `${p.last_name} ${p.first_name}`
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(p)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
                      )}
                      aria-pressed={isSelected}
                    >
                      <InitialsAvatar
                        first={p.first_name}
                        last={p.last_name}
                        size="sm"
                        tone="primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{fullName}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          {p.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3" />
                              {p.phone}
                            </span>
                          )}
                          {p.email && (
                            <span className="flex max-w-[180px] items-center gap-1 truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{p.email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Choix relation après sélection */}
          {selected && (
            <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lien de parenté avec l&apos;élève
              </label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger className="h-11 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-11 sm:h-10"
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={!selected || isPending}
            onClick={handleConfirm}
            className="h-11 sm:h-10"
          >
            {isPending ? "Liaison..." : "Lier ce parent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
