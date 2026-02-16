---
paths:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
---

# Règles Composants React — KLASSCI Frontend

## Server vs Client Components

```tsx
// SERVER COMPONENT (défaut) — pas de directive
// Peut faire des appels DB, pas d'interactivité
async function EnrollmentList({ classId }: { classId: number }) {
  const enrollments = await getEnrollments(classId) // fetch direct côté serveur
  return <EnrollmentTable data={enrollments} />
}

// CLIENT COMPONENT — uniquement si nécessaire
"use client"
// Nécessaire pour : useState, useEffect, event handlers,
// Zustand, TanStack Query, modals, formulaires interactifs
```

## Pattern Modal (Create / Edit / Show-résumé)

```tsx
// RÈGLE : Create, Edit, Show résumé = toujours Modal
// components/admin/enrollments/EnrollmentCreateModal.tsx
"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useModalStore } from "@/lib/stores/useModalStore"

export function EnrollmentCreateModal() {
  const { isOpen, close } = useModalStore("enrollment-create")

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle inscription</DialogTitle>
        </DialogHeader>
        <EnrollmentForm onSuccess={close} />
      </DialogContent>
    </Dialog>
  )
}
```

## Pattern Skeleton (Loading State)

```tsx
// Chaque composant async a son propre skeleton
// components/admin/enrollments/EnrollmentCardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"

export function EnrollmentCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  )
}

// Usage avec Suspense
<Suspense fallback={<EnrollmentCardSkeleton />}>
  <EnrollmentCard enrollmentId={id} />
</Suspense>
```

## Pattern Update Isolé (pas de refresh global)

```tsx
// Invalidation TanStack Query ciblée — met à jour uniquement le composant concerné
"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function EnrollmentStatusBadge({ enrollment }: { enrollment: Enrollment }) {
  const queryClient = useQueryClient()

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (newStatus: string) =>
      api.enrollments.updateStatus(enrollment.id, newStatus),
    onSuccess: () => {
      // Invalide uniquement cette inscription, pas toute la liste
      queryClient.invalidateQueries({ queryKey: ["enrollment", enrollment.id] })
    },
  })

  return (
    <Badge
      variant={statusVariant[enrollment.status]}
      onClick={() => updateStatus("valide")}
    >
      {isPending ? <Spinner className="h-3 w-3" /> : enrollment.status}
    </Badge>
  )
}
```

## Composants Shadcn/ui

```tsx
// CORRECT — utiliser les composants Shadcn existants
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// INTERDIT — recréer des composants qui existent dans Shadcn
// Ne pas créer un custom <Button>, <Input>, <Modal> de zéro
```

## Interdictions

```tsx
// INTERDIT — dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// INTERDIT — fetch dans useEffect
useEffect(() => {
  fetch("/api/enrollments").then(...)
}, [])
// → Utiliser TanStack Query

// INTERDIT — prop drilling profond (> 2 niveaux)
// → Utiliser Zustand ou React Context

// INTERDIT — any dans TypeScript
const data: any = await fetchData()
```
