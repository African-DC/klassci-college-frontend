# tests/ — Tests Vitest + React Testing Library

Tests unitaires et d'intégration du frontend.

## Commandes

```bash
npm run test           # Exécuter tous les tests une fois
npm run test:watch     # Mode watch (développement)
```

## Structure

```
tests/
├── setup.ts                          ← Setup global (jest-dom matchers)
├── lib/
│   ├── utils/format.test.ts          ← Tests helpers purs
│   └── validators/enrollment.test.ts ← Tests schémas Zod
└── components/
    └── forms/EnrollmentForm.test.tsx ← Tests composants formulaires
```

## Conventions

- Un fichier `.test.ts(x)` par fichier source
- Nommer les tests : `describe('EnrollmentForm') > it('should display error when student is missing')`
- Mocker les hooks TanStack Query avec `vi.mock`
- Ne pas tester les composants Shadcn (déjà testés par la librairie)
- Priorité : tester les schémas Zod, les utils, et les formulaires complexes

## Exemple de test

```tsx
// tests/lib/validators/enrollment.test.ts
import { describe, it, expect } from 'vitest';
import { createEnrollmentSchema } from '@/lib/validators/enrollment';

describe('createEnrollmentSchema', () => {
  it('should reject missing student_id', () => {
    const result = createEnrollmentSchema.safeParse({ class_id: 1 });
    expect(result.success).toBe(false);
  });

  it('should accept valid enrollment data', () => {
    const result = createEnrollmentSchema.safeParse({
      student_id: 1,
      class_id: 1,
      academic_year: '2024-2025',
      status: 'active',
    });
    expect(result.success).toBe(true);
  });
});
```
