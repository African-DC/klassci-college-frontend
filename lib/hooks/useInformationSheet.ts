"use client"

import { useQuery } from "@tanstack/react-query"
import { informationSheetApi } from "@/lib/api/information-sheet"

export const informationSheetKeys = {
  all: ["information-sheet"] as const,
  classe: (classId: number) => ["information-sheet", "class", classId] as const,
}

/** La fiche d'une classe : alimente la saisie par classe des renseignements. */
export function useClassInformationSheet(classId: number | undefined) {
  return useQuery({
    queryKey: classId ? informationSheetKeys.classe(classId) : [...informationSheetKeys.all, "none"],
    queryFn: () => informationSheetApi.forClass(classId as number),
    enabled: Boolean(classId),
    staleTime: 1000 * 15,
  })
}
