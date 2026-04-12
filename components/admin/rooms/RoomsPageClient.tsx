"use client"

import { useCallback, useMemo, useState } from "react"
import {
  DoorOpen,
  Plus,
  School,
  FlaskConical,
  Monitor,
  BookOpen,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Users,
} from "lucide-react"
import { useRooms, useDeleteRoom } from "@/lib/hooks/useRooms"
import type { Room } from "@/lib/contracts/room"
import { ROOM_TYPES } from "@/lib/contracts/room"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { RoomCreateModal } from "./RoomCreateModal"
import { RoomEditModal } from "./RoomEditModal"
import { useDebounce } from "@/lib/hooks/useDebounce"

const typeIcons: Record<string, typeof School> = {
  classroom: School,
  laboratory: FlaskConical,
  computer_room: Monitor,
  library: BookOpen,
  other: DoorOpen,
}

const typeColors: Record<string, string> = {
  classroom: "bg-primary/10 text-primary",
  laboratory: "bg-amber-500/10 text-amber-600",
  computer_room: "bg-violet-500/10 text-violet-600",
  library: "bg-emerald-500/10 text-emerald-600",
  other: "bg-muted text-muted-foreground",
}

function getRoomTypeLabel(type: string) {
  return ROOM_TYPES.find((t) => t.value === type)?.label ?? type
}

export function RoomsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const debouncedSearch = useDebounce(search)

  const params = useMemo(() => ({
    size: 200,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(typeFilter !== "all" && { room_type: typeFilter }),
  }), [debouncedSearch, typeFilter])

  const { data, isLoading, isError, error, refetch } = useRooms(params)
  const deleteMutation = useDeleteRoom()
  const rooms = data?.items ?? []

  // Group by type for summary
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const room of rooms) {
      counts[room.room_type] = (counts[room.room_type] || 0) + 1
    }
    return counts
  }, [rooms])

  if (isError) {
    return <DataError message={error?.message ?? "Impossible de charger les salles"} error={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <DoorOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Salles</h1>
            <p className="text-sm text-muted-foreground">
              {rooms.length} salle{rooms.length !== 1 ? "s" : ""} configurée{rooms.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle salle
        </Button>
      </div>

      {/* Type summary chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            typeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
          onClick={() => setTypeFilter("all")}
        >
          Toutes ({rooms.length})
        </button>
        {ROOM_TYPES.map((t) => {
          const count = typeCounts[t.value] ?? 0
          if (count === 0 && typeFilter !== t.value) return null
          const Icon = typeIcons[t.value] ?? DoorOpen
          return (
            <button
              key={t.value}
              type="button"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === t.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
              onClick={() => setTypeFilter(typeFilter === t.value ? "all" : t.value)}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une salle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          {search || typeFilter !== "all"
            ? "Aucune salle ne correspond aux filtres"
            : "Aucune salle configurée"}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={() => setEditId(room.id)}
              onDelete={() => setDeleteTarget({ id: room.id, name: room.name })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <RoomCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <RoomEditModal roomId={editId} open={editId !== null} onClose={() => setEditId(null)} />

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la salle</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La salle "{deleteTarget?.name}" sera définitivement supprimée.
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

function RoomCard({
  room,
  onEdit,
  onDelete,
}: {
  room: Room
  onEdit: () => void
  onDelete: () => void
}) {
  const Icon = typeIcons[room.room_type] ?? DoorOpen
  const colorClass = typeColors[room.room_type] ?? typeColors.other

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Icon + Type */}
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-base mb-1">{room.name}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {getRoomTypeLabel(room.room_type)}
        </p>

        {/* Capacity + Class */}
        <div className="flex items-center justify-between">
          {room.capacity ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{room.capacity} places</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Capacité non définie</span>
          )}
          {room.class_name && (
            <Badge variant="outline" className="text-xs">
              {room.class_name}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
