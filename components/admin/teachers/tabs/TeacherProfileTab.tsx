"use client"

import { User, BookOpen, Phone, CalendarDays, Mail, KeyRound, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Teacher } from "@/lib/contracts/teacher"

interface TeacherProfileTabProps {
  teacher: Teacher
}

function InfoField({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-medium">{value ?? "Non renseign\u00e9"}</p>
    </div>
  )
}

export function TeacherProfileTab({ teacher }: TeacherProfileTabProps) {
  const createdAt = teacher.created_at
    ? new Date(teacher.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="space-y-4">
      {/* Informations personnelles */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Informations personnelles</h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoField label="Nom" value={teacher.last_name} icon={User} />
            <InfoField label="Pr\u00e9nom" value={teacher.first_name} icon={User} />
            <InfoField label="Sp\u00e9cialit\u00e9" value={teacher.speciality} icon={BookOpen} />
            <InfoField label="T\u00e9l\u00e9phone" value={teacher.phone} icon={Phone} />
            <InfoField label="Cr\u00e9\u00e9 le" value={createdAt} icon={CalendarDays} />
          </div>
        </CardContent>
      </Card>

      {/* Compte utilisateur */}
      {teacher.user_id && (
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Compte utilisateur</h3>
            <p className="text-sm text-muted-foreground">
              Les informations du compte seront disponibles prochainement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
