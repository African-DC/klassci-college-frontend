"use client"

import { useState } from "react"
import { Mail, Phone, Briefcase, ShieldCheck, CalendarDays, Pencil, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionTitle } from "@/components/shared/PageHero"
import { useUpdateMyProfile } from "@/lib/hooks/useProfile"
import type { MyProfile } from "@/lib/contracts/profile"

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  )
}

function formatDate(value?: string | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

export function ProfileInfoCard({ profile }: { profile: MyProfile }) {
  const [editingPhone, setEditingPhone] = useState(false)
  const [phone, setPhone] = useState(profile.phone ?? "")
  const { mutate: update, isPending } = useUpdateMyProfile()

  const job = profile.position || profile.speciality || null

  const savePhone = () =>
    update({ phone: phone.trim() }, { onSuccess: () => setEditingPhone(false) })

  return (
    <Card className="border shadow-sm rounded-xl">
      <CardContent className="p-5 sm:p-6 space-y-5">
        <SectionTitle icon={ShieldCheck}>Mes informations</SectionTitle>

        <div className="grid gap-5 sm:grid-cols-2">
          <InfoRow icon={Mail} label="Email">
            {profile.email}
          </InfoRow>

          <InfoRow icon={Phone} label="Téléphone">
            {editingPhone ? (
              <div className="flex items-center gap-2">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex : +225 07 12 34 56 78"
                  className="h-9 font-mono"
                  autoFocus
                />
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={savePhone} disabled={isPending} aria-label="Enregistrer">
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  onClick={() => {
                    setPhone(profile.phone ?? "")
                    setEditingPhone(false)
                  }}
                  aria-label="Annuler"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={profile.phone ? "font-mono" : "text-muted-foreground"}>
                  {profile.phone || "Non renseigné"}
                </span>
                {profile.can_edit_phone && (
                  <button
                    type="button"
                    onClick={() => setEditingPhone(true)}
                    className="text-primary hover:text-primary/80"
                    aria-label="Modifier le téléphone"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </InfoRow>

          {job && (
            <InfoRow icon={Briefcase} label={profile.role === "teacher" ? "Spécialité" : "Poste"}>
              {job}
            </InfoRow>
          )}

          <InfoRow icon={CalendarDays} label="Membre depuis">
            {formatDate(profile.created_at)}
          </InfoRow>

          <InfoRow icon={CalendarDays} label="Dernière connexion">
            {profile.last_login
              ? new Date(profile.last_login).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </InfoRow>
        </div>
      </CardContent>
    </Card>
  )
}
