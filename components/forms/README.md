# components/forms/ — Formulaires

Tous les formulaires React Hook Form + Zod. Un fichier par formulaire.

## Convention

```tsx
// Toujours "use client"
// Toujours React Hook Form + zodResolver
// Toujours afficher les erreurs via FormMessage
// Toujours gerer isPending sur le bouton submit
// Toujours afficher les erreurs serveur (422/400)
```

## Formulaires a creer

| Fichier | Usage |
|---------|-------|
| `EnrollmentForm.tsx` | Creation / modification inscription |
| `PaymentForm.tsx` | Enregistrement d un paiement |
| `GradeEntryForm.tsx` | Saisie des notes (grille par classe) |
| `TimetableSlotForm.tsx` | Ajout d une seance dans l EDT |
| `FeeVariantForm.tsx` | Configuration d un variant de frais |
| `RoleForm.tsx` | Creation / modification d un role |
| `PermissionForm.tsx` | Attribution de permissions a un role |
| `StaffForm.tsx` | Creation / modification d un membre du staff |
| `TeacherForm.tsx` | Creation / modification d un enseignant |
| `StudentForm.tsx` | Creation / modification d un eleve |

## Schema Zod obligatoire

Chaque formulaire a son schema dans `lib/validators/[domaine].ts`.
Le schema doit miroir les regles de validation Pydantic du backend.
