import { AlertTriangle, BadgeCheck, CalendarDays, GraduationCap, Hash, School, ShieldAlert, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { VerifiedDocument } from "@/lib/api/verify"

// Vues de résultat partagées entre la page scannée (/verifier/[tenant]/[token])
// et le formulaire de saisie manuelle (/verifier). Composants purement
// présentationnels : pas de fetch, pas de async — ils reçoivent le document en
// props, donc utilisables aussi bien en Server Component qu'en Client Component.

function formatIssuedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof User
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
        {label}
      </span>
      <span
        className={
          mono
            ? "text-right font-mono text-sm font-medium tracking-tight text-foreground"
            : "text-right text-sm font-medium text-foreground"
        }
      >
        {value}
      </span>
    </div>
  )
}

export function AuthenticView({ doc }: { doc: VerifiedDocument }) {
  return (
    <Card className="overflow-hidden">
      {/* Sceau de validité — vert réservé à l'authenticité, l'identité reste bleue. */}
      <div className="flex flex-col items-center gap-3 bg-emerald-600 px-6 py-7 text-center text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
          <BadgeCheck className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold tracking-tight">Document authentique</p>
          <p className="text-sm text-white/85">
            Vérifié dans les registres de l&apos;établissement
          </p>
        </div>
      </div>

      <CardContent className="space-y-5 p-6">
        {/* Établissement émetteur, mis en évidence (identité = bleu KLASSCI). */}
        <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <School className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Établissement émetteur
            </p>
            <p className="truncate font-serif text-base font-semibold text-foreground">
              {doc.school_name}
            </p>
          </div>
        </div>

        {/* Récapitulatif du document. */}
        <div className="rounded-xl border bg-muted/30 px-4">
          <DetailRow icon={GraduationCap} label="Type de document" value={doc.document_type} />
          <DetailRow icon={User} label="Élève" value={doc.student_name} />
          <DetailRow icon={School} label="Classe" value={doc.class_name ?? "Non précisée"} />
          <DetailRow
            icon={CalendarDays}
            label="Année scolaire"
            value={doc.academic_year ?? "Non précisée"}
          />
          <DetailRow
            icon={CalendarDays}
            label="Date d'émission"
            value={formatIssuedAt(doc.issued_at)}
          />
          <DetailRow icon={Hash} label="Référence" value={doc.reference} mono />
        </div>

        {/* Mention légale. */}
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Ce document a été émis par {doc.school_name} via KLASSCI. Toute falsification est
          passible de poursuites.
        </p>
      </CardContent>
    </Card>
  )
}

export function NotRecognizedView() {
  return (
    <Card className="overflow-hidden border-amber-200">
      <div className="flex flex-col items-center gap-3 bg-amber-500 px-6 py-7 text-center text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold tracking-tight">Document non reconnu</p>
          <p className="text-sm text-white/90">
            Ce document ne figure pas dans nos registres
          </p>
        </div>
      </div>

      <CardContent className="space-y-4 p-6">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            Ce document pourrait être invalide ou falsifié. Aucune information ne lui est
            associée dans nos registres.
          </p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez directement
          l&apos;établissement qui a délivré le document pour confirmer son authenticité.
        </p>
      </CardContent>
    </Card>
  )
}
