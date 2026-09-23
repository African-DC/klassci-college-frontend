import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { AuditEntry } from "@/lib/contracts/audit"
import { AuditChangeSummary } from "./AuditChangeSummary"
import { AuditChangeTable } from "./AuditChangeTable"
import { AuditSubject } from "./AuditSubject"
import { changedKeys, idLabel } from "./audit-fields"
import { entityHref } from "./audit-routes"

/**
 * Le journal doit se lire avec des noms, et une modification doit montrer
 * son avant et son après sans ouvrir le détail. Ces tests rendent les vrais
 * composants et lisent ce qu'un humain verrait à l'écran.
 */
function ligne(partiel: Partial<AuditEntry>): AuditEntry {
  return {
    id: 1,
    created_at: "2026-09-22T11:04:00Z",
    action: "update",
    entity_type: "class",
    entity_id: 12,
    user_id: 3,
    subject_label: null,
    related_entities: null,
    subject_state: "active",
    value_labels: {},
    actor_name: "Sophie Yao",
    actor_email: null,
    actor_role: null,
    ip_address: null,
    notes: null,
    old_values: null,
    new_values: null,
    ...partiel,
  }
}

describe("AuditSubject", () => {
  it("affiche le nom d'abord, et le numéro seulement en petit", () => {
    render(<AuditSubject entry={ligne({ subject_label: "6e B" })} />)
    expect(screen.getByText("6e B")).toBeTruthy()
    expect(screen.getByText("Classe · n° 12")).toBeTruthy()
  })

  it("retombe sur le type et le numéro quand aucun nom n'est connu", () => {
    render(<AuditSubject entry={ligne({ subject_label: null })} />)
    expect(screen.getByText("Classe n° 12")).toBeTruthy()
  })

  it("dit qu'une fiche a été supprimée au lieu de laisser un numéro orphelin", () => {
    render(<AuditSubject entry={ligne({ subject_label: null, subject_state: "deleted" })} />)
    expect(screen.getByText(/fiche supprimée/)).toBeTruthy()
  })

  it("dit qu'une fiche est archivée, pour qu'on ne la cherche pas dans les listes", () => {
    render(<AuditSubject entry={ligne({ subject_label: "6e B", subject_state: "archived" })} />)
    expect(screen.getByText("Classe · n° 12 · fiche archivée")).toBeTruthy()
  })
})

describe("AuditChangeSummary", () => {
  it("montre l'avant et l'après sur la même ligne", () => {
    render(
      <AuditChangeSummary
        entry={ligne({ old_values: { name: "6e A" }, new_values: { name: "6e B" } })}
      />,
    )
    expect(screen.getByText("Nom :")).toBeTruthy()
    expect(screen.getByText("6e A")).toBeTruthy()
    expect(screen.getByText("6e B")).toBeTruthy()
    expect(screen.getByLabelText("devient")).toBeTruthy()
  })

  it("nomme un identifiant plutôt que d'afficher son numéro", () => {
    render(
      <AuditChangeSummary
        entry={ligne({
          old_values: { level_id: 3 },
          new_values: { level_id: 4 },
          value_labels: { "level_id:3": "6e", "level_id:4": "5e" },
        })}
      />,
    )
    expect(screen.getByText("Niveau :")).toBeTruthy()
    expect(screen.getByText("6e")).toBeTruthy()
    expect(screen.getByText("5e")).toBeTruthy()
  })

  it("n'invente pas de flèche quand l'avant n'a pas été enregistré", () => {
    render(<AuditChangeSummary entry={ligne({ new_values: { name: "6e B" } })} />)
    expect(screen.getByText("6e B")).toBeTruthy()
    expect(screen.queryByLabelText("devient")).toBeNull()
  })

  it("résume au-delà de deux champs au lieu d'allonger la ligne", () => {
    render(
      <AuditChangeSummary
        entry={ligne({
          old_values: { name: "a", capacity: 30, order: 1, room_type: "classroom" },
          new_values: { name: "b", capacity: 40, order: 2, room_type: "laboratory" },
        })}
      />,
    )
    expect(screen.getByText("et 2 autres champs")).toBeTruthy()
  })

  it("ne dit rien pour une création : il n'y a pas d'avant", () => {
    const { container } = render(
      <AuditChangeSummary entry={ligne({ action: "create", new_values: { name: "6e B" } })} />,
    )
    expect(container.textContent).toBe("")
  })
})

describe("AuditChangeTable", () => {
  it("nomme un créneau, dont la clé ne dit pas le type", () => {
    render(
      <AuditChangeTable
        entry={ligne({
          old_values: { slot_id: 60 },
          new_values: { slot_id: 61 },
          value_labels: { "slot_id:60": "6e B · Maths · lundi · 08h00" },
        })}
      />,
    )
    expect(screen.getByText("6e B · Maths · lundi · 08h00")).toBeTruthy()
    expect(screen.getByText("n° 60")).toBeTruthy()
    // Sans nom connu, le numéro se lit comme une référence, pas une quantité.
    expect(screen.getByText("n° 61")).toBeTruthy()
  })

  it("nomme aussi les identifiants rangés dans une répartition", () => {
    render(
      <AuditChangeTable
        entry={ligne({
          action: "create",
          entity_type: "payment",
          new_values: { allocations: [{ enrollment_fee_id: 9, amount: 20000 }] },
          value_labels: { "enrollment_fee_id:9": "Scolarité" },
        })}
      />,
    )
    expect(screen.getByText("Scolarité")).toBeTruthy()
    expect(screen.getByText("20 000 FCFA")).toBeTruthy()
  })
})

describe("idLabel", () => {
  it("préfère le nom résolu par le serveur, puis la fiche liée figée", () => {
    const entree = {
      value_labels: { "class_id:12": "6e B" },
      related_entities: [{ type: "student", id: 40, label: "Aminata Traoré" }],
    }
    expect(idLabel("class_id", 12, entree)).toBe("6e B")
    expect(idLabel("student_id", 40, entree)).toBe("Aminata Traoré")
    expect(idLabel("class_id", 99, entree)).toBeNull()
    // Une valeur qui n'est pas un identifiant n'est jamais « nommée ».
    expect(idLabel("capacity", 12, entree)).toBeNull()
  })
})

describe("entityHref", () => {
  it("ouvre la fiche de l'élève depuis la consultation d'un de ses documents", () => {
    expect(entityHref("document_attestation", 94)).toBe("/admin/students/94")
    expect(entityHref("school_settings", 1)).toBeNull()
  })
})

describe("changedKeys", () => {
  it("ne compte pas comme changement deux écritures du même montant", () => {
    expect(changedKeys({ amount: "50000.00", name: "a" }, { amount: 50000, name: "b" })).toEqual([
      "name",
    ])
  })
})
