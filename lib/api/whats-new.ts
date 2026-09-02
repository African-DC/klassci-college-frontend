import { z } from "zod"
import { apiFetch, safeValidate } from "./client"

/**
 * Les nouveautés viennent de deux moitiés, et il en faut deux pour dire vrai.
 *
 * Le portail embarque les siennes — les écrans — dans un fichier statique. Le
 * serveur sert les siennes : les calculs, les documents, les droits. Ne montrer
 * que la première tairait l'essentiel de ce qu'une école remarque.
 *
 * **Les deux rendent la même forme, déjà bornée.** Le serveur découpe chez lui,
 * comme le générateur du portail découpe chez lui : la règle — combien
 * d'entrées, dans quel ordre — n'existe alors qu'à un endroit par côté du fil,
 * et le téléphone ne reçoit pas cent trente kilo-octets pour en afficher six.
 */

const EntreeSchema = z.object({
  text: z.string(),
  audience: z.array(z.string()).default([]),
  pull_request: z.number().nullable().default(null),
})

const TrancheSchema = z.object({
  product: z.string(),
  generated_at: z.string(),
  version: z.string().nullable(),
  released: z.boolean().default(false),
  total: z.number().default(0),
  sections: z.record(z.string(), z.array(EntreeSchema)).default({}),
})

export type Entree = z.infer<typeof EntreeSchema>
export type Tranche = z.infer<typeof TrancheSchema>

const VIDE: Tranche = {
  product: "",
  generated_at: "",
  version: null,
  released: false,
  total: 0,
  sections: {},
}

export const whatsNewApi = {
  /** Les nouveautés du portail, servies en statique. */
  portail: async (): Promise<Tranche> => {
    const res = await fetch("/whats-new.json", { cache: "no-store" })
    if (!res.ok) return VIDE
    return safeValidate(TrancheSchema, await res.json(), "GET /whats-new.json")
  },

  /** Les nouveautés du serveur, déjà bornées par lui. */
  serveur: async (): Promise<Tranche> => {
    const json = await apiFetch<unknown>("/whats-new")
    return safeValidate(TrancheSchema, json, "GET /whats-new")
  },
}
