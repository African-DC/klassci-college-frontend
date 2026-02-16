# lib/api/ — Fonctions fetch HTTP

Toutes les fonctions qui appellent le backend FastAPI. Un fichier par domaine.

## Convention

```ts
// lib/api/enrollments.ts
const BASE = process.env.NEXT_PUBLIC_API_URL;

export const enrollmentsApi = {
  list: async (params?: { classId?: number; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${BASE}/enrollments?${qs}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new ApiError(res.status, await res.json());
    return res.json(); // { data: [...], total: N }
  },

  create: async (body: CreateEnrollmentInput) => {
    const res = await fetch(`${BASE}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new ApiError(res.status, await res.json());
    return res.json(); // { data: Enrollment }
  },

  update: async (id: number, body: UpdateEnrollmentInput) => { ... },
  remove: async (id: number) => { ... },
};
```

## Gestion des erreurs

```ts
// lib/api/errors.ts — à créer
export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API error ${status}`);
  }
}

// Les hooks TanStack Query catchent l'erreur automatiquement
// Les formulaires React Hook Form lisent error.body.detail pour afficher les messages 422
```

## Fichiers à créer

| Fichier | Endpoints couverts |
|---------|--------------------|
| `auth.ts` | POST /auth/login, POST /auth/refresh, POST /auth/logout |
| `enrollments.ts` | CRUD /enrollments |
| `students.ts` | CRUD /students |
| `teachers.ts` | CRUD /teachers |
| `staff.ts` | CRUD /staff |
| `classes.ts` | CRUD /classes |
| `subjects.ts` | CRUD /subjects |
| `fees.ts` | CRUD /fees, /fee-variants |
| `payments.ts` | CRUD /payments |
| `timetable.ts` | GET/POST /timetable, POST /timetable/generate |
| `grades.ts` | CRUD /grades, /evaluations |
| `attendance.ts` | CRUD /attendance |
| `notifications.ts` | GET /notifications, PATCH /notifications/:id/read |
| `roles.ts` | CRUD /roles, /permissions |
| `errors.ts` | Classe ApiError partagée |

## Règle

Jamais de fetch direct dans un composant ou un hook — toujours passer par ce dossier.
