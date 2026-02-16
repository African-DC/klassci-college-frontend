# lib/hooks/ — Hooks TanStack Query

Toutes les interactions serveur passent par ces hooks. Un fichier par domaine.

## Convention

```ts
// lib/hooks/useEnrollments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api/enrollments';

// Query keys centralisés — toujours dans ce fichier
export const enrollmentKeys = {
  all:    ['enrollments'] as const,
  list:   (filters?: object) => [...enrollmentKeys.all, 'list', filters] as const,
  detail: (id: number)      => [...enrollmentKeys.all, 'detail', id] as const,
};

// Hook de lecture
export function useEnrollments(filters?: { classId?: number; status?: string }) {
  return useQuery({
    queryKey: enrollmentKeys.list(filters),
    queryFn:  () => enrollmentsApi.list(filters),
    staleTime: 30_000, // 30s
  });
}

// Hook de création
export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enrollmentsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: enrollmentKeys.all }),
  });
}

// Hook de mise à jour
export function useUpdateEnrollment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateEnrollmentInput) => enrollmentsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: enrollmentKeys.all }),
  });
}
```

## Fichiers à créer

| Fichier | Entité gérée |
|---------|-------------|
| `useEnrollments.ts` | Inscriptions |
| `useStudents.ts` | Élèves |
| `useTeachers.ts` | Enseignants |
| `useStaff.ts` | Personnel |
| `useClasses.ts` | Classes |
| `useSubjects.ts` | Matières |
| `useFees.ts` | Frais scolaires + variants |
| `usePayments.ts` | Paiements |
| `useTimetable.ts` | Emploi du temps |
| `useGrades.ts` | Notes + évaluations |
| `useAttendance.ts` | Présences |
| `useNotifications.ts` | Notifications (+ polling 30s) |
| `useRoles.ts` | Rôles + permissions |
| `useAuth.ts` | Infos utilisateur connecté |

## Règles

- Jamais de `useEffect` pour fetcher des données — TanStack Query uniquement
- Les query keys exportés permettent l'invalidation ciblée depuis n'importe quel composant
- `staleTime` minimum 30s pour éviter les requêtes inutiles
- Mutations toujours suivies d'une `invalidateQueries` pour garder l'UI à jour
