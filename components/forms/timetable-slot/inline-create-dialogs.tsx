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

function generateAutoCredentials(first: string, last: string) {
  const slug = `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".")
  const suffix = String(Math.floor(Math.random() * 900) + 100)
  return {
    email: `${slug}.${suffix}@klassci.local`,
    password: `Klassci${suffix}!${first[0]?.toUpperCase() ?? "X"}`,
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
            Un compte sera créé automatiquement. Pour configurer les identifiants, rendez-vous sur la page de l'enseignant.
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
      </DialogContent>
    </Dialog>
  )
}

export function addHour(time: string): string {
  const [h, m] = time.split(":").map(Number)
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
