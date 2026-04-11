"use client"

import { User, CalendarDays, BookOpen, Mail, KeyRound, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Student } from "@/lib/contracts/student"

interface ProfileTabProps {
  student: Student
  fullData: Record<string, unknown>
}

function InfoField({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-medium">{value ?? "Non renseigne"}</p>
    </div>
  )
}

export function ProfileTab({ student, fullData }: ProfileTabProps) {
  const birthDate = student.birth_date
    ? new Date(student.birth_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  const genre = student.genre === "M" ? "Masculin" : student.genre === "F" ? "Feminin" : null

  const userEmail = fullData.user_email ? String(fullData.user_email) : null
  const isActive = fullData.is_active === true
  const lastLogin = fullData.last_login ? String(fullData.last_login) : null
  const userCreatedAt = fullData.user_created_at ? String(fullData.user_created_at) : (student.created_at ?? null)

  return (
    <div className="space-y-4">
      {/* Informations personnelles */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Informations personnelles</h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoField label="Nom" value={student.last_name} icon={User} />
            <InfoField label="Prenom" value={student.first_name} icon={User} />
            <InfoField label="Date de naissance" value={birthDate} icon={CalendarDays} />
            <InfoField label="Genre" value={genre} icon={User} />
            <InfoField label="Matricule" value={student.enrollment_number} icon={BookOpen} />
            <InfoField label="Email" value={userEmail ?? (fullData.email ? String(fullData.email) : null)} icon={Mail} />
          </div>
        </CardContent>
      </Card>

      {/* Compte utilisateur */}
      {student.user_id && (
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Compte utilisateur</h3>
              <Badge
                variant={isActive ? "default" : "destructive"}
                className={isActive ? "bg-emerald-600 hover:bg-emerald-600/80 text-[10px]" : "text-[10px]"}
              >
                {isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <InfoField
                label="Email de connexion"
                value={userEmail}
                icon={Mail}
              />
              <InfoField
                label="Derniere connexion"
                value={
                  lastLogin
                    ? new Date(lastLogin).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Jamais connecte"
                }
                icon={Shield}
              />
              <InfoField
                label="Compte cree"
                value={
                  userCreatedAt
                    ? new Date(userCreatedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : null
                }
                icon={KeyRound}
              />
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" disabled>
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                Reinitialiser le mot de passe
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
