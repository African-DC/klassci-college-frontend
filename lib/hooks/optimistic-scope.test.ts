/**
 * Une mise à jour optimiste n'écrit que dans les caches de sa forme.
 *
 * `getQueriesData` et `setQueriesData` font une correspondance par **préfixe**.
 * Demander `["timetable"]` ramène aussi la semaine d'un enseignant, qui est un
 * objet, et les disponibilités, qui sont une autre liste. Étaler l'un ou
 * mapper l'autre jette une `TypeError` **dans `onMutate`**, donc avant que la
 * requête ne parte : l'utilisateur voit « r is not iterable » et rien n'atteint
 * le serveur.
 *
 * Ces tests exercent la vraie sélection sur un vrai `QueryClient`. Le générique
 * `getQueriesData<T>` ne les rendrait pas superflus : c'est une affirmation que
 * le cache ne garantit pas, et TypeScript la croit sur parole — le défaut a
 * vécu deux jours sous un `tsc --noEmit` vert.
 */

import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { paymentKeys } from "./usePayments"
import { timetableKeys } from "./useTimetable"

/** La sélection que fait `useCreateSlot` avant d'étaler la liste. */
function listesDeCreneaux(qc: QueryClient) {
  return qc
    .getQueriesData({ queryKey: timetableKeys.all })
    .filter(([cle]) => cle[1] === "class" || cle[1] === "teacher" || cle[1] === "mine")
}

describe("le préfixe du cache emploi du temps", () => {
  it("ramène des valeurs de formes incompatibles", () => {
    const qc = new QueryClient()
    qc.setQueryData(timetableKeys.byClass(3), [{ id: 1 }])
    qc.setQueryData(timetableKeys.teacherWeek(7), { teacher_id: 7, busy: [], open: [] })

    const tout = qc.getQueriesData({ queryKey: timetableKeys.all })
    expect(tout).toHaveLength(2)

    // La preuve du défaut : étaler la semaine jette avant tout appel réseau.
    const semaine = tout.find(([cle]) => cle[1] === "week")![1]
    expect(() => [...(semaine as Iterable<unknown>)]).toThrow(TypeError)
  })

  it("ne retient que les listes de créneaux une fois filtré", () => {
    const qc = new QueryClient()
    qc.setQueryData(timetableKeys.byClass(3), [{ id: 1 }])
    qc.setQueryData(timetableKeys.byTeacher(7), [{ id: 2 }])
    qc.setQueryData(timetableKeys.mine(), [{ id: 3 }])
    qc.setQueryData(timetableKeys.teacherWeek(7), { teacher_id: 7 })
    qc.setQueryData(timetableKeys.availabilities(7), [{ id: 9 }])

    const retenues = listesDeCreneaux(qc).map(([cle]) => cle[1])
    expect(retenues.sort()).toEqual(["class", "mine", "teacher"])
  })

  it("laisse la semaine de l'enseignant intacte", () => {
    const qc = new QueryClient()
    const semaine = { teacher_id: 7, busy: [], open: [] }
    qc.setQueryData(timetableKeys.byClass(3), [{ id: 1 }])
    qc.setQueryData(timetableKeys.teacherWeek(7), semaine)

    for (const [cle, data] of listesDeCreneaux(qc)) {
      qc.setQueryData(cle, [...(data as unknown[]), { id: 99 }])
    }

    // L'assertion qui porte tout : c'est elle qui distingue le filtre par clé
    // d'un simple `Array.isArray`, lequel écrirait dans les disponibilités.
    expect(qc.getQueryData(timetableKeys.teacherWeek(7))).toBe(semaine)
    expect(qc.getQueryData(timetableKeys.byClass(3))).toHaveLength(2)
  })
})

describe("le préfixe du cache paiements", () => {
  it("ramène le récapitulatif, qui n'a pas d'items", () => {
    const qc = new QueryClient()
    qc.setQueryData(paymentKeys.list({}), { items: [{ id: 1, status: "completed" }], total: 1 })
    qc.setQueryData(paymentKeys.summary(2026), { total_completed: 1000, payment_count: 1 })

    const recap = qc
      .getQueriesData({ queryKey: paymentKeys.all })
      .find(([cle]) => cle[1] === "summary")![1] as { items?: unknown[] }

    expect(recap.items).toBeUndefined()
    expect(() => recap.items!.map((x) => x)).toThrow(TypeError)
  })
})
