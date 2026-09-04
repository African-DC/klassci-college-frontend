import { z } from "zod"

/**
 * La vue d'ensemble : une ligne par catégorie de frais, avant d'en choisir une.
 *
 * L'écran conduisait jusqu'à « voici qui doit encore » — mais seulement une
 * fois le frais deviné. La question qui vient AVANT est « quel frais rentre
 * mal », et elle n'avait aucune réponse : il fallait ouvrir les catégories une
 * par une pour comparer.
 *
 * **La même ligne de partage que le détail.** Ce qui est entré se cloisonne par
 * caisse ; ce qui reste dû ne se cloisonne pas. Le taux, l'attendu et les
 * compteurs par seau se lisent sur tout l'argent reçu : sans le droit de lire
 * toutes les caisses, ils sont `null`, jamais approchés et jamais mis à zéro.
 * `total_entre`, lui, existe toujours — c'est un fait sur la caisse qui lit.
 *
 * **Tout est facultatif sauf l'identité de la catégorie.** Le schéma rejette la
 * réponse entière au premier champ manquant : un écran déployé devant le
 * serveur qui porte cette route tomberait en bloc. Chaque valeur de repli dit
 * « on n'en sait rien » plutôt que d'inventer un chiffre.
 */
export const OverviewCategorySchema = z.object({
  category_id: z.number(),
  name: z.string(),
  /** Vrai, la catégorie compte aussi des dépôts en nature. */
  accepts_in_kind: z.boolean().default(false),
  /** Faux, le frais est facultatif : tout le monde n'a pas de ligne, et c'est normal. */
  is_mandatory: z.boolean().default(true),

  /** Entré en argent sur le périmètre. Cloisonné par caisse, donc toujours présent. */
  total_entre: z.coerce.number().default(0),
  /** Nombre de dépôts en nature enregistrés. */
  depots_en_nature: z.number().default(0),

  /** Le dénominateur du recouvrement. `null` sans le droit de lire toutes les caisses. */
  total_attendu: z.coerce.number().nullable().default(null),
  /** De 0 à 100. `null` sans ce droit, et `null` aussi quand rien n'est attendu. */
  taux: z.number().nullable().default(null),
  /** Le nombre de lignes par état, sur le périmètre entier. `null` sans ce droit. */
  compteurs: z.record(z.string(), z.number()).nullable().default(null),
  /** Inscriptions du périmètre qu'aucune ligne de cette catégorie ne couvre. */
  eleves_sans_ligne: z.number().nullable().default(null),
})

export const FeeCategoryOverviewSchema = z.object({
  /** L'année lue, telle que le serveur l'a retenue : la carte et le détail qu'elle
   *  ouvre doivent porter le même exercice, sinon les deux totaux divergent. */
  academic_year_id: z.number(),
  /** Faux, la lecture ne couvre qu'une caisse — et les cartes le disent. */
  consolide: z.boolean(),
  categories: z.array(OverviewCategorySchema).default([]),
})

export type OverviewCategory = z.infer<typeof OverviewCategorySchema>
export type FeeCategoryOverview = z.infer<typeof FeeCategoryOverviewSchema>
