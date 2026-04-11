"use client"

import { User, BookOpen, Phone, CalendarDays, Mail, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Teacher } from "@/lib/contracts/teacher"

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

export function TeacherProfileTab({ teacher, fullData }: TeacherProfileTabProps) {
  const createdAt = teacher.created_at
    ? new Date(teacher.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  // Extract user account info from /full response (flat fields from BE)
  const hasUserData = fullData && "user_email" in fullData
  const email = (fullData?.user_email as string) ?? null
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

  return (
    <div className="space-y-4">
      {/* Informations personnelles */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Informations personnelles</h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoField label="Nom" value={teacher.last_name} icon={User} />
            <InfoField label="Prénom" value={teacher.first_name} icon={User} />
            <InfoField label="Spécialité" value={teacher.speciality} icon={BookOpen} />
            <InfoField label="Téléphone" value={teacher.phone} icon={Phone} />
            <InfoField label="Créé le" value={createdAt} icon={CalendarDays} />
          </div>
        </CardContent>
      </Card>

      {/* Compte utilisateur */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Compte utilisateur</h3>
          {hasUserData ? (
            <div className="grid gap-5 sm:grid-cols-3">
              <InfoField label="Email" value={email} icon={Mail} />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Statut</p>
                </div>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <InfoField label="Dernière connexion" value={lastLoginFormatted} icon={CalendarDays} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chargement des informations du compte...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
