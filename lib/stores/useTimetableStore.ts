import { create } from "zustand"

interface TimetableState {
  selectedClassId: number | null
  view: "week" | "day"
  weekOffset: number
  setSelectedClassId: (id: number | null) => void
  setView: (view: "week" | "day") => void
  nextWeek: () => void
  prevWeek: () => void
  resetWeek: () => void
}

export const useTimetableStore = create<TimetableState>((set) => ({
  selectedClassId: null,
  view: "week",
  weekOffset: 0,
  setSelectedClassId: (id) => set({ selectedClassId: id }),
  setView: (view) => set({ view }),
  nextWeek: () => set((s) => ({ weekOffset: s.weekOffset + 1 })),
  prevWeek: () => set((s) => ({ weekOffset: s.weekOffset - 1 })),
  resetWeek: () => set({ weekOffset: 0 }),
}))
