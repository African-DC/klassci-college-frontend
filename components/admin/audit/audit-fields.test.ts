import { describe, expect, it } from "vitest"
import { comparableValue, fieldLabel, formatValue } from "./audit-fields"

/**
 * Le journal parle français, ou il ne sert à rien.
 *
 * Ces tests existent pour une raison précise : déduire le nom d'un champ à
 * partir du type d'entité est une bonne idée qui a d'abord fait disparaître
 * deux traductions, dont celle de la ligne la plus consultée du journal, la
 * répartition d'un versement. La déduction reste, mais elle est tenue.
 */
describe("fieldLabel", () => {
  it("déduit le nom d'une clé dont le type est au catalogue", () => {
    expect(fieldLabel("student_id")).toBe("Élève")
    expect(fieldLabel("class_id")).toBe("Classe")
    expect(fieldLabel("fee_category_id")).toBe("Catégorie de frais")
  })

  it("ne déduit rien d'un type que le catalogue ignore", () => {
    // `enrollment_fee` n'y est pas : une déduction rendrait « enrollment fee »,
    // qui a l'air traduit sans l'être.
    expect(fieldLabel("enrollment_fee_id")).toBe("Frais concerné")
    expect(fieldLabel("cashier_email")).toBe("Caissier")
  })

  it("rend une clé inconnue présentable plutôt que brute", () => {
    expect(fieldLabel("un_champ_inconnu")).toBe("Un champ inconnu")
  })
})

describe("formatValue", () => {
  it("écrit les montants en francs, pas en décimales de base", () => {
    const rendu = formatValue("amount", "50000.00")
    expect(rendu.kind).toBe("text")
    // Les espaces sont normalisées : `Intl` sépare les milliers par une
    // espace fine insécable, et figer ce caractère dans le test reviendrait
    // à tester ICU plutôt que notre formatage.
    expect(rendu.kind === "text" && rendu.text.replace(/\s/g, " ")).toBe("50 000 FCFA")
  })

  it("nomme les valeurs que le métier nomme", () => {
    expect(formatValue("method", "mobile_money")).toEqual({
      kind: "text",
      text: "Mobile Money",
    })
    expect(formatValue("status", "paid")).toEqual({ kind: "text", text: "Payé" })
  })

  it("dit oui et non, pas true et false", () => {
    expect(formatValue("is_published", true)).toEqual({ kind: "text", text: "Oui" })
    expect(formatValue("is_published", false)).toEqual({ kind: "text", text: "Non" })
  })

  it("annonce une structure au lieu de la réduire à une chaîne", () => {
    const repartition = [{ enrollment_fee_id: 3, amount: "20000" }]
    expect(formatValue("allocations", repartition)).toEqual({
      kind: "structured",
      value: repartition,
    })
  })

  it("marque l'absence d'un tiret, jamais d'un vide", () => {
    expect(formatValue("reference", null)).toEqual({ kind: "text", text: "—" })
    expect(formatValue("reference", "")).toEqual({ kind: "text", text: "—" })
  })
})

describe("comparableValue", () => {
  it("compare ce que le lecteur verra, pas la valeur brute", () => {
    // Le tableau ne promet que de montrer ce qui a bougé : deux écritures du
    // même montant ne font pas une modification.
    expect(comparableValue("amount", "50000.00")).toBe(comparableValue("amount", 50000))
  })

  it("distingue deux montants différents", () => {
    expect(comparableValue("amount", "30000")).not.toBe(comparableValue("amount", "50000"))
  })
})

describe("fieldLabel face aux propriétés héritées", () => {
  it("ne prend pas une propriété d'Object pour un type d'entité", () => {
    // `in` remontait la chaîne des prototypes : `constructor_id` aurait rendu
    // la fonction `Object`, là où le type promet une chaîne.
    expect(fieldLabel("constructor_id")).toBe("Constructor id")
    expect(typeof fieldLabel("constructor_id")).toBe("string")
  })
})
