---
paths:
  - "lib/hooks/**/*.ts"
  - "lib/api/**/*.ts"
  - "components/**/*.tsx"
  - "app/**/*.tsx"
---

# Règles Data Fetching — KLASSCI Frontend

## Architecture des Couches

```
Composant → hook TanStack Query → lib/api/ → fetch backend
```

## lib/api/ — Fonctions Fetch

```typescript
// lib/api/enrollments.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const enrollmentsApi = {
  list: async (params: EnrollmentListParams): Promise<PaginatedResponse<Enrollment>> => {
    const query = new URLSearchParams(params as any).toString()
    const res = await fetch(`${BASE_URL}/api/v1/enrollments?${query}`, {
      headers: {
        "Content-Type": "application/json",
        // NextAuth gère le token automatiquement via middleware
      },
      next: { tags: ["enrollments"] }, // Next.js cache tag
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Erreur serveur")
    }
    return res.json()
  },

  create: async (data: EnrollmentCreateInput): Promise<Enrollment> => {
    const res = await fetch(`${BASE_URL}/api/v1/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Erreur lors de la création")
    }
    return res.json().then(r => r.data)
  },
}
```

## lib/hooks/ — TanStack Query Hooks

```typescript
// lib/hooks/useEnrollments.ts
"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { enrollmentsApi } from "@/lib/api/enrollments"

// Query keys — centralisés pour cohérence d'invalidation
export const enrollmentKeys = {
  all: ["enrollments"] as const,
  list: (params: EnrollmentListParams) => ["enrollments", "list", params] as const,
  detail: (id: number) => ["enrollments", id] as const,
}

export function useEnrollments(params: EnrollmentListParams) {
  return useQuery({
    queryKey: enrollmentKeys.list(params),
    queryFn: () => enrollmentsApi.list(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useEnrollment(id: number) {
  return useQuery({
    queryKey: enrollmentKeys.detail(id),
    queryFn: () => enrollmentsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enrollmentsApi.create,
    onSuccess: () => {
      // Invalide la liste — recharge uniquement les composants liste
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    },
  })
}
```

## Realtime — WebSocket

```typescript
// lib/hooks/useRealtimeNotifications.ts
"use client"
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

export function useRealtimeEnrollments() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/enrollments`)

    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data)
      if (type === "enrollment_updated") {
        // Mise à jour ciblée sans refetch complet
        queryClient.setQueryData(enrollmentKeys.detail(data.id), data)
        queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
      }
    }

    return () => ws.close()
  }, [queryClient])
}
```

## Règles

- JAMAIS de `fetch` direct dans un composant
- JAMAIS de `useEffect` pour fetcher — toujours `useQuery`
- Un fichier `lib/api/{resource}.ts` par domaine
- Un fichier `lib/hooks/use{Resource}.ts` par domaine
- Query keys centralisés dans le fichier hook (export `{resource}Keys`)
- `staleTime` configuré selon la fraîcheur nécessaire des données
- Toujours gérer `isLoading`, `error`, et `data` dans les composants
