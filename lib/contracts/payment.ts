import { z } from "zod"
import {
  ALL_PAYMENT_METHODS,
  SELECTABLE_PAYMENT_METHODS,
} from "@/lib/payment-methods"

// Miroir de app/schemas/payment.py (backend)
// Refactor 2026-05-17 : Payment cible enrollment_id + PaymentAllocation breakdown.

// Ce qu'un versement DEJA enregistre peut porter. `mobile_money` en fait
// partie : la valeur a precede la distinction des quatre operateurs ivoiriens
// et reste sur les anciens versements. La retirer d'ici ferait echouer la
// validation de tout l'historique d'une ecole, et donc vider ses ecrans.
export const PaymentMethodSchema = z.enum([...ALL_PAYMENT_METHODS])

// Ce qu'un formulaire peut soumettre. Plus restreint : on ne saisit plus
// `mobile_money`, on nomme l'operateur.
export const PaymentMethodInputSchema = z.enum([...SELECTABLE_PAYMENT_METHODS])

export const PaymentStatusSchema = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
  "cancelled",
])

export const EnrollmentFeeStatusSchema = z.enum(["pending", "partial", "paid", "waived", "in_kind"])

export function isCashDue(status: string): boolean {
  return status !== "waived" && status !== "in_kind"
}

export function cashRemaining(status: string, amount: number, paid: number): number {
  if (!isCashDue(status)) return 0
  return Math.max(0, amount - paid)
}

export const FEE_STATUS_LABEL: Record<string, string> = {
  paid: "Payé",
  partial: "Partiel",
  pending: "En attente",
  waived: "Exonéré",
  in_kind: "Déposé",
}

// Split comptable d'un paiement vers un frais spécifique.
export const PaymentAllocationSchema = z.object({
  id: z.number(),
  enrollment_fee_id: z.number(),
  amount: z.coerce.number(),
  fee_category_name: z.string().nullable().optional(),
  fee_category_priority: z.number().nullable().optional(),
  enrollment_fee_status_after: z.string().nullable().optional(),
})

export const PaymentSchema = z.object({
  id: z.number(),
  enrollment_id: z.number(),
  // Champ legacy : null pour les paiements créés via le nouveau flow auto-alloc.
  enrollment_fee_id: z.number().nullable().optional(),
  amount: z.coerce.number(),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  reference: z.string().nullable(),
  notes: z.string().nullable().optional(),
  received_by: z.number().nullable().optional(),
  // Qui a encaissé, en clair. Sans lui, la colonne « Encaissé par » afficherait
  // un identifiant, ce qui ne répond pas à la question qu'on lui pose.
  received_by_name: z.string().nullable().optional(),
  // Renseignés seulement sur un versement annulé : le bordereau et le reçu
  // réimprimé les portent, l'écran doit pouvoir les dire aussi.
  cancelled_at: z.string().nullable().optional(),
  cancelled_by: z.number().nullable().optional(),
  cancelled_by_name: z.string().nullable().optional(),
  cancellation_reason: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  student_name: z.string().nullable().optional(),
  student_photo_url: z.string().nullable().optional(),
  fee_name: z.string().nullable().optional(),
  // BE renvoie toujours `allocations: []` au minimum. Optional côté TS pour
  // compat avec les call sites qui ne consomment pas ce champ.
  allocations: z.array(PaymentAllocationSchema).optional(),
})

// Body POST /payments (legacy) — cible un frais spécifique.
export const PaymentCreateSchema = z.object({
  enrollment_fee_id: z
    .number({ required_error: "Le frais d'inscription est requis" })
    .positive(),
  amount: z.string({ required_error: "Le montant est requis" }),
  method: PaymentMethodInputSchema,
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

// Un montant que l'encaisseur impute lui-même à un frais nommé.
export const PaymentAllocationInputSchema = z.object({
  enrollment_fee_id: z.number().int().positive(),
  amount: z.coerce.number().positive(),
})

// Body POST /enrollments/{id}/payments — flow Wave-style (cible).
//
// `allocations` est facultatif et le reste : absent ou vide, le serveur
// répartit le versement en cascade sur les frais dus, par ordre de priorité,
// comme il l'a toujours fait. Présent, chaque montant est imputé au frais
// nommé, et le reliquat éventuel repart en cascade. La somme des allocations
// ne peut pas dépasser le montant du versement : le serveur refuse en 422,
// l'écran empêche d'en arriver là.
export const EnrollmentPaymentCreateSchema = z.object({
  amount: z.coerce
    .number({
      required_error: "Le montant est requis",
      invalid_type_error: "Montant invalide",
    })
    .positive("Le montant doit être supérieur à zéro"),
  method: PaymentMethodInputSchema,
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  allocations: z.array(PaymentAllocationInputSchema).optional(),
})

// Preview de l'allocation avant submit (UX caissier).
//
// C'est le serveur qui répartit, y compris quand le caissier nomme lui-même
// les montants. L'écran affiche cette réponse, il ne rejoue pas le calcul :
// l'ordre de priorité, le reste dû et le sort d'un frais réglé en nature
// n'existent qu'à un seul endroit, et ne peuvent donc pas diverger.
export const AllocationPreviewLineSchema = z.object({
  enrollment_fee_id: z.number(),
  fee_category_name: z.string(),
  fee_category_priority: z.number(),
  fee_total: z.coerce.number(),
  fee_paid_before: z.coerce.number(),
  // Reste encaissable avant ce versement, zéro dès que la ligne n'est plus due
  // en argent. Rendu par le serveur, jamais redérivé ici.
  cash_remaining_before: z.coerce.number(),
  // Ce que le caissier a nommé sur ce frais. `allocated - directed` est donc
  // la part que la cascade y ajoute.
  directed: z.coerce.number(),
  allocated: z.coerce.number(),
  fee_paid_after: z.coerce.number(),
  status_after: EnrollmentFeeStatusSchema,
})

// Ce qui empêche d'enregistrer. `enrollment_fee_id` vaut null quand le
// problème porte sur la répartition entière et non sur une ligne.
export const AllocationPreviewProblemSchema = z.object({
  enrollment_fee_id: z.number().nullable(),
  message: z.string(),
})

export const AllocationPreviewSchema = z.object({
  enrollment_id: z.number(),
  amount: z.coerce.number(),
  total_remaining_before: z.coerce.number(),
  total_remaining_after: z.coerce.number(),
  directed_total: z.coerce.number(),
  cascaded_total: z.coerce.number(),
  surplus: z.coerce.number(),
  can_record: z.boolean(),
  reject_reason: z.string().nullable(),
  problems: z.array(AllocationPreviewProblemSchema),
  lines: z.array(AllocationPreviewLineSchema),
})

export const FinancialSummarySchema = z.object({
  // Vides pour une caissiere : le recouvrement est un chiffre d'ecole, il ne
  // se restreint pas a une personne. Vides et non a zero, parce qu'un zero se
  // lirait « rien n'est du ».
  total_expected: z.number().nullable(),
  total_paid: z.number(),
  total_pending: z.number(),
  total_cancelled: z.number(),
  payment_count: z.number(),
  completion_rate: z.number().nullable(),
})

/** Un compte ayant déjà encaissé — options du filtre « Encaissé par ». */
export const CashierOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const PaymentListParamsSchema = z.object({
  class_id: z.number().optional(),
  received_by: z.number().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  status: PaymentStatusSchema.optional(),
  method: PaymentMethodSchema.optional(),
  fee_category_id: z.number().optional(),
  enrollment_id: z.number().optional(),
  search: z.string().optional(),
  page: z.number().optional(),
  size: z.number().optional(),
})

export type CashierOption = z.infer<typeof CashierOptionSchema>
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>
export type EnrollmentFeeStatus = z.infer<typeof EnrollmentFeeStatusSchema>
export type PaymentAllocation = z.infer<typeof PaymentAllocationSchema>
export type PaymentAllocationInput = z.infer<typeof PaymentAllocationInputSchema>
export type Payment = z.infer<typeof PaymentSchema>
export type PaymentCreate = z.infer<typeof PaymentCreateSchema>
export type EnrollmentPaymentCreate = z.infer<typeof EnrollmentPaymentCreateSchema>
export type AllocationPreviewLine = z.infer<typeof AllocationPreviewLineSchema>
export type AllocationPreviewProblem = z.infer<typeof AllocationPreviewProblemSchema>
export type AllocationPreview = z.infer<typeof AllocationPreviewSchema>
export type FinancialSummary = z.infer<typeof FinancialSummarySchema>
export type PaymentListParams = z.infer<typeof PaymentListParamsSchema>


// ---------------------------------------------------------------------------
// Moyens de paiement disponibles pour l'utilisateur courant
// ---------------------------------------------------------------------------

/** Une entree du selecteur d'encaissement, telle que le serveur la renvoie. */
export const PaymentMethodOptionSchema = z.object({
  key: PaymentMethodInputSchema,
  label: z.string(),
})

/** L'ordre vient du serveur : l'ecran ne le recalcule pas. */
export const PaymentMethodListSchema = z.object({
  items: z.array(PaymentMethodOptionSchema),
})

export type PaymentMethodOption = z.infer<typeof PaymentMethodOptionSchema>
