"use client"

import { useMemo } from "react"
import { Cake, MapPin, UserCircle, IdCard, Mail, Clock, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Student } from "@/lib/contracts/student"
import { SectionCard, FieldRow, StatusPill } from "./_primitives"

interface ProfileTabProps {
  student: Student
  fullData?: Record<string, unknown>
}

function computeAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null
  const b = new Date(birthDate)
  if (Number.isNaN(b.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

function formatDate(d: string | null | undefined): string | null {
  if (!d) return null
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

function deriveAccountStatus(
  userId: number | null,
  isActive: boolean | undefined,
  lastLogin: string | null | undefined,
): { tone: "success" | "warning" | "danger" | "neutral"; label: string; hint: string } {
  if (!userId) return { tone: "neutral", label: "Aucun compte", hint: "L'élève n'a pas de compte utilisateur lié" }
  if (!lastLogin) return { tone: "warning", label: "En attente", hint: "Le compte n'a jamais été utilisé" }
  if (isActive === false) return { tone: "danger", label: "Désactivé", hint: "Le compte est désactivé" }
  return { tone: "success", label: "Actif", hint: "Le compte fonctionne normalement" }
}

export function ProfileTab({ student, fullData }: ProfileTabProps) {
  const f = (fullData ?? {}) as Record<string, unknown>
  const email = (f.email as string | null | undefined) ?? null
  const isActive = f.is_active as boolean | undefined
  const lastLogin = (f.last_login as string | null | undefined) ?? null
  const birthPlace = (f.birth_place as string | null | undefined) ?? null
  const nationality = (f.nationality as string | null | undefined) ?? null

  const age = useMemo(() => computeAge(student.birth_date), [student.birth_date])
  const birthLabel = formatDate(student.birth_date)
  const lastLoginLabel = formatDate(lastLogin)
  const account = deriveAccountStatus(student.user_id, isActive, lastLogin)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard
        icon={<IdCard className="h-4 w-4" />}
        title="Identité civile"
        description="Informations de l'état civil"
      >
        <div className="space-y-0">
          <FieldRow label="Matricule" value={student.enrollment_number} mono />
          <FieldRow
            label="Genre"
            value={
              student.genre ? (
                <Badge variant="outline" className="text-[10px]">
                  {student.genre === "M" ? "Masculin" : "Féminin"}
                </Badge>
              ) : null
            }
          />
          <FieldRow
            label="Date de naissance"
            value={birthLabel ? `${birthLabel}${age !== null ? ` · ${age} ans` : ""}` : null}
          />
          <FieldRow label="Lieu de naissance" value={birthPlace} />
          <FieldRow label="Nationalité" value={nationality} />
        </div>
      </SectionCard>

      <SectionCard
        icon={<MapPin className="h-4 w-4" />}
        title="Domicile"
        description="Ville et commune de résidence"
      >
        <div className="space-y-0">
          <FieldRow label="Ville" value={student.city} />
          <FieldRow label="Commune" value={student.commune} />
        </div>
        {(student.city || student.commune) && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
            <MapPin className="h-3.5 w-3.5" />
            <span>{[student.commune, student.city].filter(Boolean).join(", ")}</span>
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={<UserCircle className="h-4 w-4" />}
        title="Compte utilisateur"
        description="Accès au portail élève"
        action={
          <StatusPill tone={account.tone}>
            <ShieldCheck className="h-3 w-3" />
            {account.label}
          </StatusPill>
        }
      >
        <div className="space-y-0">
          <FieldRow
            label="Email"
            value={email ? (
              <a href={`mailto:${email}`} className="break-all text-primary hover:underline">
                {email}
              </a>
            ) : null}
          />
          <FieldRow label="Dernière connexion" value={lastLoginLabel} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{account.hint}</p>
      </SectionCard>

      <SectionCard
        icon={<Cake className="h-4 w-4" />}
        title="Repères"
        description="Anniversaires et dates clés"
      >
        <div className="space-y-3">
          {birthLabel && (
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(245,130,32,0.12)] text-[#F58220]">
                <Cake className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Anniversaire</p>
                <p className="text-sm font-medium">{birthLabel}</p>
                {age !== null && <p className="text-xs text-muted-foreground">{age} ans</p>}
              </div>
            </div>
          )}
          {lastLoginLabel && (
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Dernière connexion</p>
                <p className="text-sm font-medium">{lastLoginLabel}</p>
              </div>
            </div>
          )}
          {email && (
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email du compte</p>
                <p className="break-all text-sm font-medium">{email}</p>
              </div>
            </div>
          )}
          {!birthLabel && !lastLoginLabel && !email && (
            <p className="text-sm text-muted-foreground">
              Aucun repère renseigné pour le moment.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
