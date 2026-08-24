"use client"

/**
 * Les deux creations express du formulaire de creneau.
 *
 * Extrait de TimetableSlotForm.tsx, qui depassait la limite de taille avant
 * meme d'accueillir le panneau de disponibilite : une matiere ou un
 * enseignant qui manque se cree sans quitter la saisie, mais cela n'a rien a
 * voir avec la pose d'un creneau.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useCreateSubject } from "@/lib/hooks/useSubjects"
import { useCreateTeacher } from "@/lib/hooks/useTeachers"

export function InlineCreateSubjectDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (id: number) => void
}) {
  const [name, setName] = useState("")
  const { mutate, isPending } = useCreateSubject()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    mutate(
      {
        name: name.trim(),
        coefficient: 1,
        hours_per_week: 1,
      },
      {
        onSuccess: (created) => {
          setName("")
          onCreated(created.id)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Créer une matière</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject-name">Nom de la matière *</Label>
            <Input
              id="subject-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mathématiques"
              className="h-11"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Crée une matière catalogue. Le coefficient et les heures seront configurés lors de l'assignation à un niveau.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Des octets tires du generateur cryptographique du navigateur. */
function alea(octets: number): string {
  const buf = new Uint8Array(octets)
  crypto.getRandomValues(buf)
  return Array.from(buf, (o) => o.toString(36).padStart(2, "0")).join("")
}

/**
 * L'adresse et le mot de passe d'un enseignant cree au vol.
 *
 * Les deux sont tires separement, et c'est tout le point. La version
 * precedente derivait le mot de passe du meme suffixe a trois chiffres que
 * l'adresse : lire `aissatou.diallo.437@klassci.local` donnait
 * `Klassci437!A` sans une seule tentative. Le hasard venait de plus de
 * `Math.random`, qui ne promet rien contre la prediction.
 *
 * Le mot de passe est rendu a l'appelant pour etre montre une fois. Sans
 * cela le compte ne serait pas sur, il serait inutilisable : son
 * proprietaire legitime serait le seul a ne pas pouvoir s'y connecter.
 */
export function generateAutoCredentials(first: string, last: string) {
  const slug = `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".")
  return {
    email: `${slug}.${alea(3)}@klassci.local`,
    // Majuscule, minuscule, chiffre et signe : les regles usuelles sont
    // satisfaites sans rien retirer aux douze octets tires au sort.
    password: `Kl${alea(12)}!A9`,
  }
}

export function InlineCreateTeacherDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (id: number) => void
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [speciality, setSpeciality] = useState("")
  // Montres une fois, apres creation : personne d autre ne les connaitra.
  const [identifiants, setIdentifiants] = useState<{ email: string; password: string } | null>(null)
  const { mutate, isPending } = useCreateTeacher()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return
    const { email, password } = generateAutoCredentials(firstName.trim(), lastName.trim())
    mutate(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email,
        password,
        speciality: speciality.trim() || undefined,
      },
      {
        onSuccess: (created) => {
          setFirstName("")
          setLastName("")
          setSpeciality("")
          setIdentifiants({ email, password })
          onCreated(created.id)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Créer un enseignant</DialogTitle>
        </DialogHeader>
        {identifiants ? (
          <div className="space-y-3">
            <p className="text-sm">
              Compte créé. Ces identifiants ne seront <strong>plus jamais affichés</strong> :
              transmettez-les à l&apos;enseignant maintenant.
            </p>
            <dl className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Adresse</dt>
                <dd className="font-mono break-all">{identifiants.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Mot de passe</dt>
                <dd className="font-mono break-all">{identifiants.password}</dd>
              </div>
            </dl>
            <DialogFooter>
              <Button
                type="button"
                className="h-11"
                onClick={() => { setIdentifiants(null); onClose() }}
              >
                J&apos;ai noté, fermer
              </Button>
            </DialogFooter>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="teacher-first">Prénom *</Label>
              <Input
                id="teacher-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prénom"
                className="h-11"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher-last">Nom *</Label>
              <Input
                id="teacher-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nom"
                className="h-11"
            />
          </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teacher-spec">Spécialité</Label>
            <Input
              id="teacher-spec"
              value={speciality}
              onChange={(e) => setSpeciality(e.target.value)}
              placeholder="Ex: Mathématiques (optionnel)"
              className="h-11"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Un compte sera créé, et ses identifiants affichés une seule fois : notez-les avant de fermer.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending || !firstName.trim() || !lastName.trim()}
            >
              {isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function addHour(time: string): string {
  const [h, m] = time.split(":").map(Number)
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
