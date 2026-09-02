"use client"

import { useCallback, useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { whatsNewApi, type Entree, type Tranche } from "@/lib/api/whats-new"
import { concerne } from "@/lib/whats-new/audience"

const VU = "klassci.nouveautes.vu"

/** Une ligne à montrer, avec la moitié du produit dont elle vient. */
export interface Nouveaute extends Entree {
  section: string
}

/**
 * Ce qui a changé, pour la personne qui regarde.
 *
 * Les deux moitiés sont demandées en parallèle : elles ne dépendent pas l'une
 * de l'autre, et les enchaîner ferait attendre le portail pour rien. Si l'une
 * échoue, l'autre s'affiche — une cloche de nouveautés n'a pas à tomber en
 * panne parce qu'un fichier manque.
 */
export function useWhatsNew() {
  const { data: session } = useSession()
  const role = session?.user?.role

  const { data, isLoading } = useQuery({
    queryKey: ["whats-new"],
    queryFn: async () => {
      const [portail, serveur] = await Promise.allSettled([
        whatsNewApi.portail(),
        whatsNewApi.serveur(),
      ])
      return {
        portail: portail.status === "fulfilled" ? portail.value : null,
        serveur: serveur.status === "fulfilled" ? serveur.value : null,
      }
    },
    // Une nouveauté ne le reste pas dix minutes : une heure suffit largement,
    // et évite de redemander deux fichiers à chaque navigation.
    staleTime: 1000 * 60 * 60,
  })

  const lignes = aplatir(data?.portail, data?.serveur, role)
  const marqueur = `${data?.portail?.generated_at ?? ""}|${data?.serveur?.generated_at ?? ""}`

  const [vu, setVu] = useState<string | null>(null)
  useEffect(() => {
    try {
      setVu(window.localStorage.getItem(VU))
    } catch {
      // Navigation privée : on considère que rien n'a été vu. Au pire la
      // fenêtre s'ouvre une fois de plus, ce qui ne coûte rien.
      setVu(null)
    }
  }, [])

  const marquerVu = useCallback(() => {
    setVu(marqueur)
    try {
      window.localStorage.setItem(VU, marqueur)
    } catch {
      // Se souvenir est un confort, pas une garantie.
    }
  }, [marqueur])

  // Ce que la troncature laisse de cote, et rien d'autre. Comparer au nombre
  // de lignes filtrees par role melangerait deux raisons tres differentes de
  // ne pas voir une entree : « il y en a d'autres » et « celle-la n'est pas
  // pour vous ». Annoncer la seconde comme la premiere serait un mensonge
  // poli.
  const tranchees = [data?.portail, data?.serveur].reduce(
    (n, t) => n + Object.values(t?.sections ?? {}).reduce((m, s) => m + s.length, 0),
    0,
  )

  return {
    lignes,
    tronquees: Math.max(0, (data?.portail?.total ?? 0) + (data?.serveur?.total ?? 0) - tranchees),
    isLoading,
    // `vu === null` au premier rendu vaut « pas encore lu le stockage » autant
    // que « jamais vu » : on attend d'avoir des lignes pour trancher, sinon la
    // fenêtre s'ouvrirait sur une liste vide le temps du chargement.
    duNeuf: lignes.length > 0 && vu !== marqueur,
    marquerVu,
  }
}

function aplatir(
  portail: Tranche | null | undefined,
  serveur: Tranche | null | undefined,
  role: string | undefined,
): Nouveaute[] {
  const lignes: Nouveaute[] = []
  for (const tranche of [portail, serveur]) {
    for (const [section, entrees] of Object.entries(tranche?.sections ?? {})) {
      for (const entree of entrees) {
        if (concerne(role, entree.audience)) lignes.push({ ...entree, section })
      }
    }
  }
  return lignes
}
