import { Eye, FilePlus2, LogIn, LogOut, PencilLine, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { actionLabel, actionTone } from "./audit-labels"

const ICONS: Record<string, typeof Eye> = {
  create: FilePlus2,
  update: PencilLine,
  delete: Trash2,
  read: Eye,
  login: LogIn,
  logout: LogOut,
}

const TONE_STYLES = {
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
} as const

export function AuditActionBadge({ action, className }: { action: string; className?: string }) {
  const Icon = ICONS[action] ?? Eye
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_STYLES[actionTone(action)],
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      {actionLabel(action)}
    </span>
  )
}
