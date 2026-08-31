import { z } from "zod"

// Miroir de la répercussion d'un tarif modifié sur les inscriptions
// existantes (app/schemas/fee.py, côté backend).

/**
 * Les compteurs communs à l'aperçu et au résultat.
 *
 * Mêmes noms des deux côtés : c'est ce qui permet à l'école de comparer ce
 * qu'on lui avait annoncé et ce qui a été fait. `amount` et `debt_delta`
 * passent par `coerce` parce que le serveur sérialise ses décimales en
 * chaînes, et qu'un `z.number()` nu ferait échouer la validation.
 */
const feePropagationShape = {
  variant_id: z.number(),
  fee_category_id: z.number(),
  category_name: z.string(),
  academic_year_id: z.number(),
  amount: z.coerce.number(),
  /** Somme des cinq paquets : une catégorie ne produit qu'une ligne par inscription. */
  enrollments_concerned: z.number(),
  fees_already_up_to_date: z.number(),
  fees_kept_with_payments: z.number(),
  fees_waived: z.number(),
  /** Écart total de dette en francs, négatif quand le tarif baisse. */
  debt_delta: z.coerce.number(),
  message: z.string(),
}

export const FeePropagationPreviewSchema = z.object({
  ...feePropagationShape,
  fees_to_update: z.number(),
  /**
   * Inscriptions qui ne portent pas encore ce frais et qui le porteraient.
   *
   * C'est le paquet qui fait apparaître une dette chez une famille qui n'en
   * avait aucune, là où les autres ne font que corriger un montant déjà dû.
   */
  fees_to_create: z.number(),
})

export const FeePropagationResultSchema = z.object({
  ...feePropagationShape,
  fees_updated: z.number(),
  fees_created: z.number(),
})

export type FeePropagationPreview = z.infer<typeof FeePropagationPreviewSchema>
export type FeePropagationResult = z.infer<typeof FeePropagationResultSchema>

/** Un paquet de la répartition affichée avant, puis après, la répercussion. */
export interface PropagationBucket {
  key: string
  label: string
  detail?: string
  count: number
  /** Toujours affiché, même à zéro : « 0 ligne à créer » est une réponse. */
  emphase?: boolean
}

/**
 * Les deux paquets qui écrivent, quelle que soit la forme reçue.
 *
 * L'aperçu annonce au futur, le résultat constate au passé, sous des noms
 * différents pour que l'école puisse comparer les deux. Ce qu'ils comptent est
 * le même, et un seul endroit ici sait le lire.
 */
function lignesEcrites(compteurs: FeePropagationPreview | FeePropagationResult): {
  misAJour: number
  crees: number
} {
  return {
    misAJour: "fees_updated" in compteurs ? compteurs.fees_updated : compteurs.fees_to_update,
    crees: "fees_created" in compteurs ? compteurs.fees_created : compteurs.fees_to_create,
  }
}

/**
 * La répartition, dans l'ordre de lecture, pour l'aperçu comme pour le résultat.
 *
 * Un seul endroit construit les paquets, parce que l'invariant qu'ils portent
 * est arithmétique : leur somme vaut `enrollments_concerned`, une inscription
 * ne tombant que dans un seul. Les construire deux fois, c'est la garantie
 * qu'un paquet ajouté côté serveur s'affichera d'un côté et manquera de
 * l'autre, et que le total affiché cessera de tomber juste sans le dire.
 */
export function propagationBuckets(
  compteurs: FeePropagationPreview | FeePropagationResult,
): PropagationBucket[] {
  const { misAJour, crees } = lignesEcrites(compteurs)
  const fait = "fees_updated" in compteurs

  return [
    {
      key: "update",
      label: fait ? "Lignes mises à jour" : "Lignes à mettre à jour",
      detail: "Le montant dû change, la dette existait déjà.",
      count: misAJour,
      emphase: true,
    },
    {
      key: "create",
      label: fait ? "Lignes créées" : "Lignes à créer",
      detail: fait
        ? "Ces familles n'avaient pas ce frais : la dette leur a été ajoutée."
        : "Ces familles n'ont pas ce frais : une dette apparaîtra chez elles.",
      count: crees,
      emphase: true,
    },
    {
      key: "kept",
      label: "Conservées, un versement y est imputé",
      detail: "Le reçu déjà remis à la famille reste vrai.",
      count: compteurs.fees_kept_with_payments,
    },
    { key: "up-to-date", label: "Déjà au bon montant", count: compteurs.fees_already_up_to_date },
    { key: "waived", label: "Exonérées", count: compteurs.fees_waived },
  ]
}

/**
 * Nombre de lignes que la répercussion écrirait, ou a écrites.
 *
 * `createMissing` reprend le drapeau envoyé au serveur : par défaut il ne crée
 * rien, et les lignes manquantes ne comptent donc pas comme des écritures à
 * venir. Corriger une faute de frappe sur le prix de la tenue ne doit pas
 * proposer un bouton qui ouvre en plus une dette chez des familles.
 */
export function propagationWriteCount(
  compteurs: FeePropagationPreview | FeePropagationResult,
  createMissing = false,
): number {
  const { misAJour, crees } = lignesEcrites(compteurs)
  return misAJour + (createMissing ? crees : 0)
}

/** La tête de l'aperçu, qui doit couvrir les deux populations à la fois. */
export interface PropagationHeadline {
  /** Total annoncé, somme des paquets. */
  total: number
  /** Suit le total, sans prétendre que toutes les inscriptions portent le frais. */
  phrase: string
  /** La répartition entre celles qui le portent et celles qui ne l'ont pas. */
  detail: string
}

/**
 * Ce que le total recouvre vraiment.
 *
 * `enrollments_concerned` additionne cinq paquets, dont « lignes à créer », qui
 * compte précisément les inscriptions ne portant PAS ce frais. Annoncer
 * « N inscriptions portent ce tarif » au-dessus d'un paquet qui dit « ces
 * familles n'ont pas ce frais » fait mentir l'une des deux phrases, et l'école
 * ne sait plus laquelle croire. On annonce donc une population concernée, puis
 * on dit comment elle se partage.
 */
export function propagationHeadline(
  compteurs: FeePropagationPreview | FeePropagationResult,
): PropagationHeadline {
  const { crees } = lignesEcrites(compteurs)
  const fait = "fees_updated" in compteurs
  const total = compteurs.enrollments_concerned
  const portent = Math.max(total - crees, 0)

  const phrase =
    total > 1
      ? "inscriptions de cette année sont concernées par ce tarif."
      : "inscription de cette année est concernée par ce tarif."

  let detail: string
  if (crees === 0) {
    detail = fait ? "Toutes portaient déjà ce frais." : "Toutes portent déjà ce frais."
  } else if (fait) {
    detail =
      `${portent} le ${portent > 1 ? "portaient" : "portait"} déjà, ` +
      `${crees} ne l'${crees > 1 ? "avaient" : "avait"} pas.`
  } else {
    detail =
      `${portent} le ${portent > 1 ? "portent" : "porte"} déjà, ` +
      `${crees} ne l'${crees > 1 ? "ont" : "a"} pas encore.`
  }

  return { total, phrase, detail }
}

/**
 * La phrase qui accompagne la création, avec le nombre de familles visées.
 *
 * Créer une ligne n'est pas corriger un montant : la dette apparaît chez une
 * famille qui n'en avait aucune, et cette famille la découvrirait sur la
 * facture. Le nombre est donc dans la phrase, pas seulement dans le tableau.
 */
export function createMissingWarning(crees: number): string {
  return crees > 1
    ? `Une dette apparaîtra chez ${crees} familles qui n'avaient pas ce frais.`
    : `Une dette apparaîtra chez ${crees} famille qui n'avait pas ce frais.`
}

/**
 * L'écart de dette, signé et en francs.
 *
 * Le signe est explicite des deux côtés : « 81 000 F » seul ne dit pas si
 * l'école va réclamer davantage ou rendre de l'argent, et c'est la seule
 * chose que la comptable veut savoir en lisant cette ligne.
 */
export function formatDebtDelta(delta: number): string {
  if (delta === 0) return "0 F"
  const signe = delta > 0 ? "+" : "\u2212"
  return `${signe}${Math.abs(delta).toLocaleString("fr-FR")} F`
}
