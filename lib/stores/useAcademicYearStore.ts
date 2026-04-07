import { create } from "zustand"
import type { AcademicYear } from "@/lib/contracts/academic-year"

interface AcademicYearState {
  currentYear: AcademicYear | null
  isLoading: boolean
  setCurrentYear: (year: AcademicYear | null) => void
  setLoading: (loading: boolean) => void
}

export const useAcademicYearStore = create<AcademicYearState>((set) => ({
  currentYear: null,
  isLoading: true,
  setCurrentYear: (year) => set({ currentYear: year, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
