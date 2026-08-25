import type { Subject } from "@/lib/contracts/subject"

export interface SubjectGroup {
  name: string
  catalogue: Subject | null
  instances: Subject[]
  totalHours: number
}