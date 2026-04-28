"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { User, CalendarDays, Mail, KeyRound, Shield, UserPlus, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Student } from "@/lib/contracts/student"
import { studentKeys } from "@/lib/hooks/useStudents"
import { getSession } from "next-auth/react"

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
      <p className="text-sm font-medium">{value ?? "Non renseigné"}</p>
    </div>
  )
}

export function ProfileTab({ student, fullData }: ProfileTabProps) {
  const queryClient = useQueryClient()
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [createAccountOpen, setCreateAccountOpen] = useState(false)
  const [emailValue, setEmailValue] = useState("")
  const [passwordValue, setPasswordValue] = useState("")
  const [saving, setSaving] = useState(false)

  const birthDate = student.birth_date
    ? new Date(student.birth_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  const userEmail = fullData.user_email ? String(fullData.user_email) : null
  const isActive = fullData.is_active === true
  const lastLogin = fullData.last_login ? String(fullData.last_login) : null
  const userCreatedAt = fullData.user_created_at ? String(fullData.user_created_at) : (student.created_at ?? null)
  const hasUserAccount = !!student.user_id
  const needsEmailConfig = hasUserAccount && !userEmail

  const handleSaveAccount = async () => {
    if (!student.user_id) return
    if (!emailValue.includes("@")) {
      toast.error("Veuillez saisir un email valide")
      return
    }
    setSaving(true)
    try {
      const session = await getSession()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      const body: Record<string, string> = { email: emailValue }
      if (passwordValue.length > 0) body.password = passwordValue

      const res = await fetch(`${baseUrl}/admin/users/${student.user_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Erreur serveur" }))
        throw new Error(err.detail || "Erreur lors de la mise à jour")
      }
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(student.id) })
      toast.success("Compte mis à jour")
      setEmailDialogOpen(false)
      setEmailValue("")
      setPasswordValue("")
    } catch (err) {
      toast.error("Erreur", { description: err instanceof Error ? err.message : "Erreur inconnue" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Informations personnelles — drop Matricule + Genre (déjà dans header)
          et Email (déduplique avec Compte utilisateur Email de connexion) */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Informations personnelles</h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoField label="Nom" value={student.last_name} icon={User} />
            <InfoField label="Prénom" value={student.first_name} icon={User} />
            <InfoField label="Date de naissance" value={birthDate} icon={CalendarDays} />
            <InfoField label="Ville" value={student.city} icon={MapPin} />
            <InfoField label="Commune" value={student.commune} icon={MapPin} />
          </div>
        </CardContent>
      </Card>

      {/* Compte utilisateur */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          {hasUserAccount ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Compte utilisateur</h3>
                {(() => {
                  // Tri-état : Actif (déjà connecté + actif), En attente (jamais
                  // connecté → orange amber, neutre), Désactivé (déjà connecté
                  // mais désactivé → rouge alarmant). Évite le « Inactif » rouge
                  // alarmiste pour un compte simplement pas encore activé.
                  if (isActive && lastLogin) {
                    return (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600/80 text-[10px]">
                        Actif
                      </Badge>
                    )
                  }
                  if (!isActive) {
                    return <Badge variant="destructive" className="text-[10px]">Désactivé</Badge>
                  }
                  return (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100/80 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
                      En attente
                    </Badge>
                  )
                })()}
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <InfoField
                  label="Email de connexion"
                  value={userEmail}
                  icon={Mail}
                />
                <InfoField
                  label="Dernière connexion"
                  value={
                    lastLogin
                      ? new Date(lastLogin).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Jamais connecté"
                  }
                  icon={Shield}
                />
                <InfoField
                  label="Compte créé"
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
              <div className="mt-4 flex gap-2">
                {needsEmailConfig ? (
                  <Button variant="default" size="sm" onClick={() => setEmailDialogOpen(true)}>
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    Configurer l&apos;email
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
                      <Mail className="mr-1.5 h-3.5 w-3.5" />
                      Modifier l&apos;email
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                      Réinitialiser le mot de passe
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                <UserPlus className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-medium mb-1">Aucun compte utilisateur</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-sm">
                Cet élève n&apos;a pas encore de compte pour se connecter au portail étudiant.
              </p>
              <Button variant="default" size="sm" onClick={() => {
                setEmailValue("")
                setPasswordValue("")
                setCreateAccountOpen(true)
              }}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Créer un compte
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email configuration dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {needsEmailConfig ? "Configurer le compte" : "Modifier l'email"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-email">Email de connexion</Label>
              <Input
                id="account-email"
                type="email"
                placeholder="eleve@exemple.ci"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-password">
                Mot de passe {!needsEmailConfig && "(laisser vide pour ne pas changer)"}
              </Label>
              <Input
                id="account-password"
                type="password"
                placeholder={needsEmailConfig ? "Minimum 8 caractères" : "Nouveau mot de passe"}
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                className="h-11"
              />
            </div>
            <Button
              className="w-full h-11"
              onClick={handleSaveAccount}
              disabled={saving || !emailValue}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create account dialog — for students without user account */}
      <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Créer un compte utilisateur</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ce compte permettra à l&apos;élève de se connecter au portail étudiant.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-account-email">Email de connexion *</Label>
              <Input
                id="new-account-email"
                type="email"
                placeholder="eleve@exemple.ci"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-account-password">Mot de passe *</Label>
              <Input
                id="new-account-password"
                type="password"
                placeholder="Minimum 8 caractères"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                className="h-11"
              />
            </div>
            <Button
              className="w-full h-11"
              onClick={async () => {
                if (!emailValue.includes("@")) {
                  toast.error("Veuillez saisir un email valide")
                  return
                }
                if (passwordValue.length < 8) {
                  toast.error("Le mot de passe doit contenir au moins 8 caractères")
                  return
                }
                setSaving(true)
                try {
                  const session = await getSession()
                  const baseUrl = process.env.NEXT_PUBLIC_API_URL
                  const res = await fetch(`${baseUrl}/admin/students/${student.id}/account`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
                    },
                    body: JSON.stringify({ email: emailValue, password: passwordValue }),
                  })
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: "Erreur serveur" }))
                    throw new Error(typeof err.detail === "string" ? err.detail : "Erreur lors de la création")
                  }
                  queryClient.invalidateQueries({ queryKey: studentKeys.all })
                  queryClient.invalidateQueries({ queryKey: studentKeys.detail(student.id) })
                  toast.success("Compte créé avec succès")
                  setCreateAccountOpen(false)
                  setEmailValue("")
                  setPasswordValue("")
                } catch (err) {
                  toast.error("Erreur", { description: err instanceof Error ? err.message : "Erreur inconnue" })
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving || !emailValue || passwordValue.length < 8}
            >
              {saving ? "Création en cours..." : "Créer le compte"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
