"use client"

import { useState, useMemo } from "react"
import { ClipboardList, History, BarChart3, UserCheck } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceGrid } from "./AttendanceGrid"
import { AttendanceHistory } from "./AttendanceHistory"
import { AttendanceStats } from "./AttendanceStats"
import { useTimetable } from "@/lib/hooks/useTimetable"
import type { TimetableSlot } from "@/lib/contracts/timetable"

// TODO: remplacer par useClasses() après merge de PR #42 (feature/36-admin-crud-pages)
const DEMO_CLASSES = [
  { id: 1, name: "6ème A" },
  { id: 2, name: "6ème B" },
  { id: 3, name: "5ème A" },
  { id: 4, name: "5ème B" },
  { id: 5, name: "4ème A" },
  { id: 6, name: "3ème A" },
]

function formatSlotLabel(slot: TimetableSlot): string {
  return `${slot.subject_name} — ${slot.day} ${slot.start_time}-${slot.end_time}`
}

export function AttendancePageClient() {
  const [classId, setClassId] = useState<number | undefined>(undefined)
  const [slotId, setSlotId] = useState<number | undefined>(undefined)
  const [date, setDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  })

  // Créneaux de la classe sélectionnée
  const { data: slots } = useTimetable(classId!)

  // Filtrer les créneaux du jour sélectionné
  const dayOfWeek = useMemo(() => {
    if (!date) return ""
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return ""
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
    return days[d.getDay()]
  }, [date])

  const availableSlots = useMemo(() => {
    if (!slots || !dayOfWeek) return []
    return slots.filter((s) => s.day === dayOfWeek)
  }, [slots, dayOfWeek])

  // Réinitialiser le créneau quand la classe ou la date change
  function handleClassChange(id: number) {
    setClassId(id)
    setSlotId(undefined)
  }

  function handleDateChange(newDate: string) {
    setDate(newDate)
    setSlotId(undefined)
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="font-serif text-2xl tracking-tight">Présences</h1>
        <p className="text-sm text-muted-foreground">
          Pointage des présences par session de cours, historique et statistiques
        </p>
      </div>

      {/* Filtres principaux */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="filter-class" className="text-xs text-muted-foreground">Classe</label>
          <Select
            value={classId?.toString() ?? ""}
            onValueChange={(v) => handleClassChange(Number(v))}
          >
            <SelectTrigger id="filter-class" className="w-40">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              {DEMO_CLASSES.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label htmlFor="filter-date" className="text-xs text-muted-foreground">Date</label>
          <Input
            id="filter-date"
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-40"
          />
        </div>

        {classId && (
          <div className="space-y-1">
            <label htmlFor="filter-slot" className="text-xs text-muted-foreground">Créneau</label>
            <Select
              value={slotId?.toString() ?? ""}
              onValueChange={(v) => setSlotId(Number(v))}
            >
              <SelectTrigger id="filter-slot" className="w-64">
                <SelectValue placeholder="Sélectionner un créneau" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Aucun créneau ce jour
                  </SelectItem>
                ) : (
                  availableSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id.toString()}>
                      {formatSlotLabel(slot)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Onglets */}
      <Tabs defaultValue="pointage">
        <TabsList>
          <TabsTrigger value="pointage">
            <ClipboardList className="mr-2 h-4 w-4" />
            Pointage
          </TabsTrigger>
          <TabsTrigger value="historique">
            <History className="mr-2 h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="statistiques">
            <BarChart3 className="mr-2 h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pointage">
          {classId && slotId && date ? (
            <AttendanceGrid classId={classId} slotId={slotId} date={date} />
          ) : (
            <div className="py-16 text-center">
              <UserCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Sélectionnez une classe, une date et un créneau pour commencer le pointage.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historique">
          <AttendanceHistory classId={classId} />
        </TabsContent>

        <TabsContent value="statistiques">
          <AttendanceStats classId={classId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
