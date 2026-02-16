---
paths:
  - "components/**/*Form*.tsx"
  - "components/**/*form*.tsx"
  - "lib/validators/**/*.ts"
---

# Règles Formulaires — KLASSCI Frontend

## Stack Obligatoire : React Hook Form + Zod

```tsx
// 1. Définir le schéma Zod dans lib/validators/
// lib/validators/enrollment.ts
import { z } from "zod"

export const enrollmentCreateSchema = z.object({
  student_id: z.number({ required_error: "Étudiant requis" }).positive(),
  class_id: z.number({ required_error: "Classe requise" }).positive(),
  academic_year_id: z.number().positive(),
  assignment_status: z.enum(["affecte", "reaffecte", "non_affecte"]),
  is_scholarship: z.boolean().default(false),
})

export type EnrollmentCreateInput = z.infer<typeof enrollmentCreateSchema>
```

```tsx
// 2. Utiliser dans le composant
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

export function EnrollmentForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<EnrollmentCreateInput>({
    resolver: zodResolver(enrollmentCreateSchema),
    defaultValues: { is_scholarship: false },
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: api.enrollments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      onSuccess()
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="student_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Étudiant *</FormLabel>
              <FormControl>
                <StudentSelect {...field} />
              </FormControl>
              <FormMessage /> {/* Affiche l'erreur Zod */}
            </FormItem>
          )}
        />

        {/* Erreur serveur */}
        {error && (
          <p className="text-sm text-destructive">{error.message}</p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Form>
  )
}
```

## Règles

- Schéma Zod dans `lib/validators/` — pas inline dans le composant
- Le schéma Zod doit **miroir** les règles de validation du backend Pydantic
- Toujours utiliser `FormMessage` pour afficher les erreurs de validation
- Toujours gérer l'état `isPending` pour désactiver le bouton submit
- Toujours afficher les erreurs serveur (réponse 422/400 de l'API)
- `defaultValues` obligatoire pour éviter les inputs non contrôlés

## Interdictions

```tsx
// INTERDIT — validation manuelle sans Zod
if (!email.includes("@")) { setError("email invalide") }

// INTERDIT — submit sans React Hook Form
const handleSubmit = async (e) => {
  e.preventDefault()
  const email = e.target.email.value  // accès direct au DOM
}

// INTERDIT — état de formulaire dans useState
const [name, setName] = useState("")
const [email, setEmail] = useState("")
// → Utiliser useForm avec defaultValues
```
