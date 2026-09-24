/**
 * Le guichet, vu par la personne qui le tient.
 *
 * Ces tests rendent les vrais composants et lisent ce qui s'affiche : quel
 * bouton une ligne propose selon les droits de l'école, ce que voit qui ne
 * peut pas encaisser, et ce que l'écran de reçu dit après un versement.
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Enrollment } from "@/lib/contracts/enrollment"
import type { Payment } from "@/lib/contracts/payment"
import { EnrollmentNextAction } from "@/components/admin/enrollments/EnrollmentNextAction"
import { newSubmissionKey } from "@/lib/utils/submission-key"

const droits = vi.hoisted(() => ({ liste: [] as string[] }))

vi.mock("@/lib/hooks/usePermissions", () => ({
  usePermissions: () => ({
    permissions: droits.liste,
    has: (slug: string) => droits.liste.includes(slug),
    hasAny: () => false,
    hasAll: () => false,
    isLoading: false,
    isFetching: false,
  }),
}))

// L'écran de reçu importe la mutation de validation : on la double, on
// observe seulement ce qui lui est passé.
const valider = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
vi.mock("@/lib/hooks/useEnrollments", () => ({ useValidateEnrollment: () => valider }))

import { EnrollmentCheckout } from "./EnrollmentCheckout"
import { PaymentSuccessPanel } from "./PaymentSuccessPanel"

function avecRequetes(enfant: ReactNode) {
  return <QueryClientProvider client={new QueryClient()}>{enfant}</QueryClientProvider>
}

function inscription(partiel: Partial<Enrollment>): Enrollment {
  return {
    id: 42,
    student_id: 5,
    class_id: 3,
    academic_year_id: 1,
    academic_year_name: "2025-2026",
    status: "prospect",
    fee_variant_id: null,
    notes: null,
    created_by: 1,
    created_at: "2026-09-24T08:00:00Z",
    updated_at: "2026-09-24T08:00:00Z",
    student_first_name: "Aminata",
    student_last_name: "Traoré",
    class_name: "6e B",
    awaiting_payment: true,
    ...partiel,
  }
}

function action(enrollment: Enrollment, peutEncaisser: boolean, peutValider: boolean) {
  const onEncaisser = vi.fn()
  const onValider = vi.fn()
  render(
    <EnrollmentNextAction
      enrollment={enrollment}
      peutEncaisser={peutEncaisser}
      peutValider={peutValider}
      onEncaisser={onEncaisser}
      onValider={onValider}
    />,
  )
  return { onEncaisser, onValider }
}

beforeEach(() => {
  droits.liste = []
  valider.mutate.mockReset()
})

describe("le bouton d'une ligne", () => {
  it("propose d'encaisser tant qu'aucun versement n'est reçu", () => {
    const { onEncaisser } = action(inscription({ awaiting_payment: true }), true, true)
    fireEvent.click(screen.getByRole("button", { name: /Encaisser/ }))
    expect(onEncaisser).toHaveBeenCalledOnce()
    expect(screen.queryByRole("button", { name: /Valider/ })).toBeNull()
  })

  it("dit que le dossier attend la caisse à qui ne peut pas encaisser", () => {
    action(inscription({ awaiting_payment: true }), false, true)
    expect(screen.getByText("Attend un versement à la caisse")).toBeTruthy()
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("propose de valider une fois le versement reçu", () => {
    const { onValider } = action(inscription({ awaiting_payment: false }), true, true)
    fireEvent.click(screen.getByRole("button", { name: /Valider/ }))
    expect(onValider).toHaveBeenCalledOnce()
  })

  it("ne propose rien à qui n'a pas le droit de valider", () => {
    action(inscription({ awaiting_payment: false }), true, false)
    expect(screen.queryByRole("button")).toBeNull()
  })
})

describe("après l'inscription, sans droit d'encaisser", () => {
  it("annonce que le dossier part à la caisse, sans formulaire voué au refus", () => {
    render(
      avecRequetes(
        <EnrollmentCheckout
          enrollmentId={42}
          studentName="Traoré Aminata"
          contexte="6e B · 2025-2026"
          onDone={() => {}}
        />,
      ),
    )
    expect(screen.getByText("Dossier transmis à la caisse")).toBeTruthy()
    expect(screen.queryByLabelText(/Montant versé/)).toBeNull()
  })
})

const versement: Payment = {
  id: 900,
  enrollment_id: 42,
  enrollment_fee_id: null,
  amount: 25000,
  method: "cash",
  status: "completed",
  reference: null,
  received_by: 7,
  notes: null,
  created_at: "2026-09-24T08:05:00Z",
  updated_at: "2026-09-24T08:05:00Z",
  enrollment_awaiting_validation: true,
  enrollment_remaining_after: 30000,
  allocations: [
    { id: 1, enrollment_fee_id: 10, amount: 25000, fee_category_name: "Inscription" },
  ],
} as Payment

describe("l'écran de reçu", () => {
  it("met le reçu, la répartition et le reste à payer sous les yeux", () => {
    render(
      avecRequetes(
        <PaymentSuccessPanel
          payment={versement}
          studentName="Traoré Aminata"
          onDone={() => {}}
        />,
      ),
    )
    expect(screen.getByRole("button", { name: /Voir et imprimer le reçu/ })).toBeTruthy()
    expect(screen.getByText("Inscription")).toBeTruthy()
    expect(screen.getByText(/Reste à payer/)).toBeTruthy()
  })

  it("propose la validation à qui en a le droit", () => {
    droits.liste = ["enrollments:validate"]
    render(
      avecRequetes(
        <PaymentSuccessPanel payment={versement} studentName="X" onDone={() => {}} />,
      ),
    )
    fireEvent.click(screen.getByRole("button", { name: /Valider l'inscription/ }))
    expect(valider.mutate).toHaveBeenCalledWith(42, expect.anything())
  })

  it("dit aux autres que la demande de validation est partie", () => {
    render(
      avecRequetes(
        <PaymentSuccessPanel payment={versement} studentName="X" onDone={() => {}} />,
      ),
    )
    expect(screen.getByText(/ont été prévenues, avec le montant reçu/)).toBeTruthy()
    expect(screen.queryByRole("button", { name: /Valider l'inscription/ })).toBeNull()
  })
})

describe("la clé d'envoi", () => {
  it("change à chaque nouvelle saisie, et reste dans le format accepté par le serveur", () => {
    const a = newSubmissionKey()
    const b = newSubmissionKey()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
  })
})
