import { Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type Audience = "student" | "parent"
type Variant = "full" | "inline"

interface NotEnrolledBannerProps {
  audience: Audience
  /** Nom de l'élève à mentionner (uniquement utile pour audience=parent). */
  studentName?: string
  /** Année académique courante (ex: "2025-2026"). Si absent, la mention temporelle est omise. */
  academicYear?: string | null
  /** "full" = banner pleine largeur top-of-page. "inline" = compact pour intégration dans une card enfant. */
  variant?: Variant
  className?: string
}

interface BannerCopy {
  title: string
  body: string
}

function buildCopy(
  audience: Audience,
  studentName: string | undefined,
  academicYear: string | null | undefined,
): BannerCopy {
  const yearSuffix = academicYear ? ` pour ${academicYear}` : ""
  if (audience === "student") {
    return {
      title: `Inscription en attente de validation${yearSuffix}`,
      body:
        "Votre dossier n'a pas encore été validé par l'administration. Passez au secrétariat de l'école pour finaliser votre inscription. Vos notes et frais s'afficheront ici une fois la validation effectuée.",
    }
  }
  const who = studentName ? `de ${studentName}` : "de votre enfant"
  return {
    title: `Inscription ${who} en attente${yearSuffix}`,
    body:
      "Le dossier n'a pas encore été validé par l'administration. Rendez-vous au secrétariat de l'école pour finaliser. Les notes, présences et frais apparaîtront ici dès que l'inscription sera validée.",
  }
}

export function NotEnrolledBanner({
  audience,
  studentName,
  academicYear,
  variant = "full",
  className,
}: NotEnrolledBannerProps) {
  const { title, body } = buildCopy(audience, studentName, academicYear)
  const Icon = variant === "full" ? AlertTriangle : Clock

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30",
        variant === "full" ? "p-4" : "p-3",
        className,
      )}
    >
      <Icon
        className={cn(
          "shrink-0 text-amber-600 dark:text-amber-400",
          variant === "full" ? "h-5 w-5" : "h-4 w-4 mt-0.5",
        )}
        aria-hidden
      />
      <div className="min-w-0 space-y-1">
        <p
          className={cn(
            "font-medium text-amber-900 dark:text-amber-100",
            variant === "full" ? "text-sm" : "text-xs",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "leading-relaxed text-amber-800 dark:text-amber-200",
            variant === "full" ? "text-sm" : "text-[11px]",
          )}
        >
          {body}
        </p>
      </div>
    </div>
  )
}
