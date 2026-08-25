/**
 * La mise à jour optimiste doit atteindre les deux formes de cache.
 *
 * Depuis le défilement continu, deux formes cohabitent sous le même préfixe :
 * la page unique `{items}` et la liste accumulée `{pages}`. L'ancienne version
 * gardait `if (!old?.items) return old` — elle ne jetait donc pas d'erreur sur
 * la seconde, elle ne faisait simplement rien. La ligne qu'une caissière
 * venait de valider restait inchangée jusqu'au rechargement, lequel redemande
 * *toutes* les pages chargées : dix pages parcourues, dix requêtes par clic,
 * sans le moindre retour visuel entre-temps.
 *
 * Ce test exerce le vrai cache d'un vrai QueryClient.
 */

import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { paymentKeys } from "./usePayments"

/** La même mise à jour que `usePayments`, appliquée au cache. */
function marquer(qc: QueryClient, paymentId: number, statut: string) {
  const remplace = (p: { id: number; status: string }) =>
    p.id === paymentId ? { ...p, status: statut } : p
  qc.setQueriesData<unknown>(
    {
      queryKey: paymentKeys.all,
      predicate: (q) => q.queryKey[1] === "list" || q.queryKey[1] === "enrollment",
    },
    (old: unknown) => {
      if (!old || typeof old !== "object") return old
      const accumulee = old as { pages?: { items: { id: number; status: string }[] }[] }
      if (Array.isArray(accumulee.pages)) {
        return {
          ...accumulee,
          pages: accumulee.pages.map((page) => ({ ...page, items: page.items.map(remplace) })),
        }
      }
      const page = old as { items?: { id: number; status: string }[] }
      if (!Array.isArray(page.items)) return old
      return { ...page, items: page.items.map(remplace) }
    },
  )
}

const ligne = (id: number) => ({ id, status: "completed" })

describe("marquer un versement dans le cache", () => {
  it("atteint la liste accumulée du défilement continu", () => {
    const qc = new QueryClient()
    qc.setQueryData([...paymentKeys.list({}), "infinite"], {
      pages: [{ items: [ligne(1), ligne(2)] }, { items: [ligne(3)] }],
      pageParams: [1, 2],
    })

    marquer(qc, 3, "cancelled")

    const data = qc.getQueryData([...paymentKeys.list({}), "infinite"]) as {
      pages: { items: { id: number; status: string }[] }[]
    }
    // La ligne est en seconde page : c'est tout l'objet du correctif.
    expect(data.pages[1].items[0].status).toBe("cancelled")
    expect(data.pages[0].items[0].status).toBe("completed")
  })

  it("atteint encore la page unique", () => {
    const qc = new QueryClient()
    qc.setQueryData(paymentKeys.list({}), { items: [ligne(1), ligne(2)], total: 2 })
    marquer(qc, 1, "cancelled")
    const data = qc.getQueryData(paymentKeys.list({})) as { items: { status: string }[] }
    expect(data.items[0].status).toBe("cancelled")
  })

  it("laisse intact un cache d'une autre forme", () => {
    // Le récapitulatif vit sous le même préfixe et n'a pas d'items : l'étaler
    // ou le mapper jetterait, comme cela s'est déjà produit ici.
    const qc = new QueryClient()
    const recap = { total_paid: 1000, payment_count: 3 }
    qc.setQueryData(paymentKeys.summary(2026), recap)
    expect(() => marquer(qc, 1, "cancelled")).not.toThrow()
    expect(qc.getQueryData(paymentKeys.summary(2026))).toBe(recap)
  })
})
