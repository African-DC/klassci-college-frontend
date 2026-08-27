"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { StudentCreateSchema, type StudentCreate } from "@/lib/contracts/student"
import { useCreateStudent } from "@/lib/hooks/useStudents"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StudentPhotoField } from "@/components/admin/students/photo/StudentPhotoField"
import { useAttachStudentPhoto } from "@/lib/hooks/useStudentPhoto"
import { AlerteDoublon } from "@/components/shared/AlerteDoublon"
import { useDoublonsFormulaire } from "@/lib/hooks/useDoublonsFormulaire"

interface StudentFormProps {
  onSuccess: () => void
}

export function StudentForm({ onSuccess }: StudentFormProps) {
  const [photo, setPhoto] = useState<File | null>(null)
  const form = useForm<StudentCreate>({
    resolver: zodResolver(StudentCreateSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      enrollment_number: "",
      birth_date: "",
      birth_place: "",
      genre: undefined,
      city: "",
      commune: "",
    },
  })

  const { mutate, isPending, error } = useCreateStudent()
  const attachPhoto = useAttachStudentPhoto()

  function onSubmit(data: StudentCreate) {
    mutate(data, {
      onSuccess: async (student) => {
        await attachPhoto.mutateAsync({ studentId: student.id, photo })
        form.reset()
        setPhoto(null)
        onSuccess()
      },
    })
  }

  // La saisie est surveillée pendant qu'elle se fait : signaler après
  // l'enregistrement arriverait trop tard, la seconde fiche existerait.
  const { correspondances } = useDoublonsFormulaire(form)

  return (
    <Form {...form}>
      <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <AlerteDoublon
          correspondances={correspondances}
          action="Créer cette fiche"
        />

        <StudentPhotoField value={photo} onChange={setPhoto} disabled={isPending || attachPhoto.isPending} />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex : Kalala" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex : Patrick" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="eleve@ecole.ci" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe *</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="8 caractères min." className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="enrollment_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matricule</FormLabel>
                <FormControl>
                  <Input placeholder="Ex : STU-2026-001" className="h-11" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birth_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de naissance</FormLabel>
                <FormControl>
                  <Input type="date" className="h-11" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birth_place"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lieu de naissance</FormLabel>
                <FormControl>
                  <Input placeholder="Ex : Bouaké" className="h-11" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ville</FormLabel>
                <FormControl>
                  <Input placeholder="Ex : Abidjan" className="h-11" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commune"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commune</FormLabel>
                <FormControl>
                  <Input placeholder="Ex : Cocody" className="h-11" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full h-11 font-semibold" disabled={isPending || attachPhoto.isPending}>
          {attachPhoto.isPending ? "Envoi de la photo..." : isPending ? "Enregistrement..." : "Enregistrer l'élève"}
        </Button>
      </form>
    </Form>
  )
}
