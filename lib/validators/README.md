# lib/validators/ — Schémas Zod

Tous les schémas de validation des formulaires. Un fichier par domaine.
Ces schémas doivent être le miroir exact des règles de validation Pydantic du backend.

## Convention

```ts
// lib/validators/enrollment.ts
import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  student_id:    z.number({ required_error: 'Élève requis' }).positive(),
  class_id:      z.number({ required_error: 'Classe requise' }).positive(),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, 'Format: 2024-2025'),
  status:        z.enum(['active', 'pending', 'transferred', 'withdrawn']),
  fee_variant_id: z.number().positive().optional(),
});

export const updateEnrollmentSchema = createEnrollmentSchema.partial();

// Types inférés pour React Hook Form
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
```

## Usage dans un formulaire

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { createEnrollmentSchema, CreateEnrollmentInput } from '@/lib/validators/enrollment';

const form = useForm<CreateEnrollmentInput>({
  resolver: zodResolver(createEnrollmentSchema),
});
```

## Fichiers à créer

| Fichier | Schémas couverts |
|---------|-----------------|
| `auth.ts` | loginSchema |
| `enrollment.ts` | createEnrollmentSchema, updateEnrollmentSchema |
| `student.ts` | createStudentSchema, updateStudentSchema |
| `teacher.ts` | createTeacherSchema, updateTeacherSchema |
| `staff.ts` | createStaffSchema, updateStaffSchema |
| `fee.ts` | createFeeSchema, createFeeVariantSchema |
| `payment.ts` | createPaymentSchema |
| `grade.ts` | gradeEntrySchema, createEvaluationSchema |
| `timetable.ts` | createTimetableSlotSchema |
| `attendance.ts` | recordAttendanceSchema |
| `role.ts` | createRoleSchema, assignPermissionSchema |

## Règle de synchronisation backend

Quand un modèle Pydantic backend change, le schéma Zod correspondant doit être mis à jour
**dans le même PR**. Les deux doivent toujours être en sync.
