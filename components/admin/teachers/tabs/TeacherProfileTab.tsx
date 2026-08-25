"use client"

import { User, Users, Briefcase, BookOpen, Phone, CalendarDays, Mail, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { teacherContractLabel, teacherGenreLabel, type Teacher } from "@/lib/contracts/teacher"

interface TeacherProfileTabProps {
  teacher: Teacher
  fullData?: Record<string, unknown>
}

function InfoField({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-medium">{value ?? "Non renseigné"}</p>
    </div>
  )
}

/**
 * Tri-état sémantique sur le statut du compte (cf. rule redesign-premium.md
 * principe 14) : `lastLogin === null` est diagnostiqué AVANT `isActive === false`
 * pour qu'un compte fraîchement provisionné mais jamais connecté affiche
 * « En attente » (amber rassurant) plutôt que « Désactivé » (rouge alarmant).
 */
function getAccountBadge(isActive: boolean | undefined, lastLogin: string | undefined) {
  if (!lastLogin) {
    return {
      label: "En attente",
      variant: "outline" as const,
      className:
        "border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
    }
  }
  if (isActive === false) {
    return { label: "Désactivé", variant: "destructive" as const, className: "" }
  }
  return {
    label: "Actif",
    variant: "outline" as const,
    className: "border-emerald-500 text-emerald-600",
  }
}

export function TeacherProfileTab({ teacher, fullData }: TeacherProfileTabProps) {
  const createdAt = teacher.created_at
    ? new Date(teacher.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  // Extract user account info from /full response (flat fields from BE)
  const isLoaded = fullData !== undefined && fullData !== null
  const hasUserAccount =
    isLoaded && "user_email" in (fullData as Record<string, unknown>)
  const email = (fullData?.user_email as string | null | undefined) ?? null
  const isActive = fullData?.user_is_active as boolean | undefined
  const lastLogin = fullData?.user_last_login as string | undefined

  const lastLoginFormatted = lastLogin
    ? new Date(lastLogin).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Jamais"

  const badge = getAccountBadge(isActive, lastLogin)

  return (
    <div className="space-y-4">
      {/* Informations personnelles */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Informations personnelles</h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoField label="Nom" value={teacher.last_name} icon={User} />
            <InfoField label="Prénom" value={teacher.first_name} icon={User} />
            <InfoField label="Sexe" value={teacherGenreLabel(teacher.genre)} icon={Users} />
            <InfoField label="Spécialité" value={teacher.speciality} icon={BookOpen} />
            <InfoField
              label="Type de contrat"
              value={teacherContractLabel(teacher.contract_type)}
              icon={Briefcase}
            />
            <InfoField label="Téléphone" value={teacher.phone} icon={Phone} />
            <InfoField label="Créé le" value={createdAt} icon={CalendarDays} />
          </div>
        </CardContent>
      </Card>

      {/* Compte utilisateur — skeleton tant que la query /full n'a pas répondu,
          empty state propre si l'enseignant n'a pas de compte auth, sinon
          affichage des 3 champs avec tri-état sémantique sur le statut. */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Compte utilisateur</h3>
          {!isLoaded ? (
            <div className="grid gap-5 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted/40" />
                </div>
              ))}
            </div>
          ) : !hasUserAccount ? (
            <p className="text-sm text-muted-foreground">
              Cet enseignant n&apos;a pas de compte utilisateur associé. Modifiez la
              fiche pour ajouter un email et un mot de passe.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-3">
              <InfoField label="Email" value={email} icon={Mail} />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Statut</p>
                </div>
                <Badge variant={badge.variant} className={`text-xs ${badge.className}`}>
                  {badge.label}
                </Badge>
              </div>
              <InfoField label="Dernière connexion" value={lastLoginFormatted} icon={CalendarDays} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
