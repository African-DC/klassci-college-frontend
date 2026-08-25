export interface AssignSeriesOption {
  id: number
  name: string
  level_id: number
}

export interface AssignTarget {
  subjectId: number
  subjectName: string
  levelId?: number
  levelName?: string
  seriesId?: number | null
  defaultCoef: number
  defaultHours: number
}