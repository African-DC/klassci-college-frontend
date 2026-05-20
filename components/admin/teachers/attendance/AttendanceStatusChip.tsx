import type { TeacherAttendanceStatus } from "@/lib/contracts/teacher-attendance"
import {
  STATUS_CHIP_CLASS,
  STATUS_LABEL,
  formatLateMinutes,
} from "./teacher-attendance-helpers"

interface AttendanceStatusChipProps {
  status: TeacherAttendanceStatus
  lateMinutes: number
}

/** Rounded chip with semantic color + optional late-minutes suffix (e.g. "En retard · 15 min"). */
export function AttendanceStatusChip({
  status,
  lateMinutes,
}: AttendanceStatusChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_CHIP_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
      {status === "late" && lateMinutes > 0 && (
        <span className="ml-1 font-semibold">
          · {formatLateMinutes(lateMinutes)}
        </span>
      )}
    </span>
  )
}
