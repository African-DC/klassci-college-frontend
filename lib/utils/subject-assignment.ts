export interface AssignableSeries {
  id: number
}

export interface AssignableInstance {
  level_id: number | null
  series_id: number | null
}

export function instancesForLevel(
  instances: AssignableInstance[],
  levelId: number,
): AssignableInstance[] {
  return instances.filter((instance) => instance.level_id === levelId)
}

export function isSeriesSlotTaken(
  levelInstances: AssignableInstance[],
  seriesId: number | null,
): boolean {
  return levelInstances.some((instance) => instance.series_id === seriesId)
}

export function seriesSlots(series: AssignableSeries[]): Array<number | null> {
  return series.length === 0 ? [null] : [null, ...series.map((item) => item.id)]
}

export function isLevelAssignable(
  levelInstances: AssignableInstance[],
  series: AssignableSeries[],
): boolean {
  return seriesSlots(series).some((slot) => !isSeriesSlotTaken(levelInstances, slot))
}

export function firstFreeSeriesSlot(
  levelInstances: AssignableInstance[],
  series: AssignableSeries[],
): number | null | undefined {
  return seriesSlots(series).find((slot) => !isSeriesSlotTaken(levelInstances, slot))
}