import { AlertTriangle, CheckCircle2, Clock } from "lucide-react"

type Tone = "neutral" | "warning" | "success"

const ICONES = {
  neutral: Clock,
  warning: AlertTriangle,
  success: CheckCircle2,
} as const

/**
 * Une page entière pour un seul message : lien périmé, service absent, envoi
 * terminé.
 *
 * L'icône ne porte jamais l'information à elle seule, et la couleur non plus :
 * le titre dit ce qui se passe en toutes lettres, parce que cette page se lit
 * à bout de bras, dehors, sur un écran qui rend mal les nuances.
 */
export function HandoffNotice({
  tone,
  title,
  message,
  children,
}: {
  tone: Tone
  title: string
  message: string
  children?: React.ReactNode
}) {
  const Icone = ICONES[tone]
  const couleur =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-primary"

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Icone className={`h-14 w-14 ${couleur}`} aria-hidden="true" />
      <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
      <p className="max-w-sm text-base leading-relaxed text-foreground/80">{message}</p>
      {children}
    </section>
  )
}
