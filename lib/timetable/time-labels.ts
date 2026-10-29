/** Label positions are presentation concerns; course timestamps remain untouched. */
export function visibleTimeLabels(
  times: Iterable<number>,
  startHour: number,
  endHour: number,
  pixelsPerHour: number,
  minSpacingPx = 13,
): number[] {
  const result: number[] = []
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => (startHour + index) * 60)
  for (const minute of Array.from(times).sort((a, b) => a - b)) {
    if (minute < startHour * 60 || minute > endHour * 60) continue
    if (hours.some((hour) => Math.abs(minute - hour) * pixelsPerHour / 60 < minSpacingPx)) continue
    if (result.length && (minute - result[result.length - 1]) * pixelsPerHour / 60 < minSpacingPx) continue
    result.push(minute)
  }
  return result
}
