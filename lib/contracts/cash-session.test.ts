import { describe, expect, it } from "vitest"
import {
  CASH_STATUS,
  CashSessionListSchema,
  CashSessionSchema,
  hasBeenCounted,
  isAutoClosed,
  isLocked,
} from "./cash-session"

/**
 * Une journée de caisse a trois états, et les confondre a un coût réel :
 * afficher « écart 0 » sur une caisse que personne n'a comptée dit au
 * comptable que le tiroir tombe juste.
 */

const baseSession = {
  id: 1,
  cashier_user_id: 7,
  cashier_name: "Sophie Yao",
  business_date: "2026-08-20",
  status: CASH_STATUS.OPEN,
  opened_at: "2026-08-20T08:00:00",
  payments_count: 3,
  total_collected: 150000,
  cash_collected: 120000,
  by_method: [{ method: "cash", label: "Espèces", count: 3, total: 120000 }],
}

describe("états d'une journée de caisse", () => {
  it("verrouille une journée clôturée d'office comme une journée signée", () => {
    // Son théorique est figé : y encaisser ou y annuler le rendrait faux.
    expect(isLocked({ status: CASH_STATUS.AUTO_CLOSED })).toBe(true)
    expect(isLocked({ status: CASH_STATUS.CLOSED })).toBe(true)
    expect(isLocked({ status: CASH_STATUS.OPEN })).toBe(false)
  })

  it("ne considère comptée qu'une journée dont le caissier a ouvert le tiroir", () => {
    expect(hasBeenCounted({ status: CASH_STATUS.CLOSED })).toBe(true)
    expect(hasBeenCounted({ status: CASH_STATUS.AUTO_CLOSED })).toBe(false)
    expect(hasBeenCounted({ status: CASH_STATUS.OPEN })).toBe(false)
  })

  it("distingue la clôture d'office de la clôture normale", () => {
    expect(isAutoClosed({ status: CASH_STATUS.AUTO_CLOSED })).toBe(true)
    expect(isAutoClosed({ status: CASH_STATUS.CLOSED })).toBe(false)
  })
})

describe("contrat d'une journée clôturée d'office", () => {
  it("accepte un montant compté et un écart absents", () => {
    const parsed = CashSessionSchema.parse({
      ...baseSession,
      status: CASH_STATUS.AUTO_CLOSED,
      closed_at: "2026-08-21T00:10:00",
      expected_amount: 120000,
      counted_amount: null,
      variance: null,
      regularized_at: null,
    })

    expect(parsed.expected_amount).toBe(120000)
    // Absents, et surtout pas ramenés à zéro par le contrat.
    expect(parsed.counted_amount).toBeNull()
    expect(parsed.variance).toBeNull()
    expect(hasBeenCounted(parsed)).toBe(false)
  })

  it("garde la trace d'une régularisation après coup", () => {
    const parsed = CashSessionSchema.parse({
      ...baseSession,
      status: CASH_STATUS.CLOSED,
      closed_at: "2026-08-21T00:10:00",
      expected_amount: 120000,
      counted_amount: 118500,
      variance: -1500,
      regularized_at: "2026-08-21T09:12:00",
    })

    expect(parsed.variance).toBe(-1500)
    expect(parsed.regularized_at).toBe("2026-08-21T09:12:00")
    expect(hasBeenCounted(parsed)).toBe(true)
  })

  it("rejette un écart envoyé en chaîne, comme le ferait un Decimal Pydantic", () => {
    const result = CashSessionSchema.safeParse({
      ...baseSession,
      status: CASH_STATUS.CLOSED,
      variance: "-1500",
    })
    expect(result.success).toBe(false)
  })
})

describe("point journalier", () => {
  it("compte à part les caisses clôturées d'office", () => {
    const parsed = CashSessionListSchema.parse({
      items: [],
      business_date: "2026-08-20",
      total_collected: 0,
      cash_collected: 0,
      total_variance: 0,
      open_count: 0,
      closed_count: 2,
      auto_closed_count: 1,
    })
    expect(parsed.auto_closed_count).toBe(1)
  })

  it("reste lisible face à un backend qui n'envoie pas encore ce compteur", () => {
    const parsed = CashSessionListSchema.parse({
      items: [],
      business_date: "2026-08-20",
      total_collected: 0,
      cash_collected: 0,
      total_variance: 0,
      open_count: 1,
      closed_count: 0,
    })
    // Absent plutôt que défaut Zod : un `.default()` ferait diverger les types
    // d'entrée et de sortie du schéma, et `safeValidate` ne compilerait plus.
    expect(parsed.auto_closed_count).toBeUndefined()
  })
})
