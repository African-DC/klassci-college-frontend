"use client"

import { useState, useMemo } from "react"
import { ClipboardList, ClipboardCheck, History, BarChart3, UserCheck, School, BookOpen, CalendarDays } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { AttendanceGrid } from "./AttendanceGrid"
import { AttendanceHistory } from "./AttendanceHistory"
import { AttendanceStats } from "./AttendanceStats"
import { useTimetable } from "@/lib/hooks/useTimetable"
import { useClasses } from "@/lib/hooks/useClasses"
import type { TimetableSlot } from "@/lib/contracts/timetable"

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

  const { data: classesData } = useClasses()
  const classes = classesData?.items ?? []

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

  // Contexte sélectionné — affiché en subtitle pour rappeler à l'admin
  // sur quelle classe / quel jour il pointe (sinon stats opaques).
  const selectedClass = classes.find((c) => c.id === classId)
  const subtitle = selectedClass
    ? `Classe ${selectedClass.name}${dayOfWeek ? ` · ${dayOfWeek}` : ""}`
    : "Pointage des présences par session de cours, historique et statistiques"

  const kpis: HeroKpi[] = [
    { label: "Classes", value: classes.length, icon: School },
    {
      label: selectedClass ? "Créneaux de la classe" : "Créneaux",
      value: selectedClass ? (slots?.length ?? 0) : "—",
      icon: BookOpen,
    },
    {
      label: "Créneaux ce jour",
      value: selectedClass ? availableSlots.length : "—",
      icon: CalendarDays,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero signature KLASSCI (dégradé bleu + KPIs intégrés) */}
      <PageHero
        icon={ClipboardCheck}
        title="Présences"
        subtitle={<span className="capitalize">{subtitle}</span>}
        kpis={kpis}
      />

      {/* Filtres principaux */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px] flex-1 space-y-1 sm:flex-none">
          <label htmlFor="filter-class" className="text-xs text-muted-foreground">Classe</label>
          <Select
            value={classId?.toString() ?? ""}
            onValueChange={(v) => handleClassChange(Number(v))}
          >
            <SelectTrigger id="filter-class" className="h-11 w-full sm:h-10 sm:w-40">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[140px] flex-1 space-y-1 sm:flex-none">
          <label htmlFor="filter-date" className="text-xs text-muted-foreground">Date</label>
          <Input
            id="filter-date"
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="h-11 w-full sm:h-10 sm:w-40"
          />
        </div>

        {classId && (
          <div className="min-w-[200px] flex-1 space-y-1 sm:flex-none">
            <label htmlFor="filter-slot" className="text-xs text-muted-foreground">Créneau</label>
            <Select
              value={slotId?.toString() ?? ""}
              onValueChange={(v) => setSlotId(Number(v))}
            >
              <SelectTrigger id="filter-slot" className="h-11 w-full sm:h-10 sm:w-64">
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
            <ClipboardList aria-hidden="true" className="mr-2 h-4 w-4" />
            Pointage
          </TabsTrigger>
          <TabsTrigger value="historique">
            <History aria-hidden="true" className="mr-2 h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="statistiques">
            <BarChart3 aria-hidden="true" className="mr-2 h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pointage">
          {classId && slotId && date ? (
            <AttendanceGrid classId={classId} slotId={slotId} date={date} />
          ) : (
            <div className="py-16 text-center">
              <UserCheck aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
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
