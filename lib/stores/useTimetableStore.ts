import { create } from "zustand"

interface TimetableState {
  selectedClassId: number | null
  view: "week" | "day"
  setSelectedClassId: (id: number | null) => void
  setView: (view: "week" | "day") => void
}

export const useTimetableStore = create<TimetableState>((set) => ({
  selectedClassId: null,
  view: "week",
  setSelectedClassId: (id) => set({ selectedClassId: id }),
  setView: (view) => set({ view }),
}))
