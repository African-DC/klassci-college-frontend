"use client"

import { useEffect } from "react"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useAcademicYearStore } from "@/lib/stores/useAcademicYearStore"

export function AcademicYearProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useAcademicYears()
  const { setCurrentYear, setLoading } = useAcademicYearStore()

  useEffect(() => {
    if (!isLoading && data) {
      const current = data.items?.find((y) => y.is_current) ?? null
      setCurrentYear(current)
    }
    setLoading(isLoading)
  }, [data, isLoading, setCurrentYear, setLoading])

  return <>{children}</>
}
