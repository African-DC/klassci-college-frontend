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
 * `total_en_argent`, lui, existe toujours — c'est un fait sur la caisse qui lit.
 *
 * **Les noms sont ceux du serveur, sans traduction.** Ce fichier en avait
 * inventé trois (`name`, `total_entre`, `taux`) : la réponse était rejetée en
 * bloc, l'écran affichait poliment « n'a pas pu être chargée », et la grille
 * ne se serait jamais affichée une seule fois.
 *
 * **Tout est facultatif sauf l'identité de la catégorie.** Le schéma rejette la
 * réponse entière au premier champ manquant : un écran déployé devant le
 * serveur qui porte cette route tomberait en bloc. Chaque valeur de repli dit
 * « on n'en sait rien » plutôt que d'inventer un chiffre.
 */
export const OverviewCategorySchema = z.object({
  category_id: z.number(),
  /** Le nom porte celui du serveur : `category_name`, comme le detail. Deux
   *  noms pour la meme chose finissent par diverger, et c'est arrive ici. */
  category_name: z.string(),
  /** Vrai, la catégorie compte aussi des dépôts en nature. */
  accepts_in_kind: z.boolean().default(false),
  /** Faux, le frais est facultatif : tout le monde n'a pas de ligne, et c'est normal. */
  is_mandatory: z.boolean().default(true),

  /** Combien d'inscriptions cette catégorie facture, et combien elle laisse
   *  de côté. Des inscriptions, pas de l'argent : elles ne se cloisonnent pas. */
  eleves_factures: z.number().nullable().default(null),
  eleves_sans_ligne: z.number().nullable().default(null),

  /** Entré en argent sur le périmètre, cloisonné par caisse.
   *
   *  `null` et non `0` quand le serveur ne le rend pas : c'est de l'argent
   *  encaissé, et un zéro affiché se lirait comme « rien n'est rentré ». Une
   *  caissière ayant encaissé 400 000 F sur la scolarité lirait « 0 F ». */
  eleves_en_argent: z.number().nullable().default(null),
  total_en_argent: z.coerce.number().nullable().default(null),
  depots_en_nature: z.number().nullable().default(null),

  /** L'outil de recouvrement, qui se lit sur tout l'argent reçu. `null` sans
   *  `payments:read:all` — absent plutôt que faux, jamais mis à zéro. */
  eleves_restant_du: z.number().nullable().default(null),
  total_restant_du: z.coerce.number().nullable().default(null),
  /** Le dénominateur du recouvrement. */
  total_attendu: z.coerce.number().nullable().default(null),
  /** De 0 à 100. `null` sans ce droit, et `null` aussi quand rien n'est attendu. */
  taux_recouvrement: z.number().nullable().default(null),
  /** Le nombre de lignes par état, sur le périmètre entier. `null` sans ce droit. */
  compteurs: z.record(z.string(), z.number()).nullable().default(null),
})

export const FeeCategoryOverviewSchema = z.object({
  /** L'année lue, telle que le serveur l'a retenue : la carte et le détail qu'elle
   *  ouvre doivent porter le même exercice, sinon les deux totaux divergent. */
  academic_year_id: z.number(),
  class_id: z.number().nullable().default(null),
  class_name: z.string().default(""),
  /** Faux, la lecture ne couvre qu'une caisse — et les cartes le disent. */
  consolide: z.boolean(),
  /** Les inscriptions ouvertes du périmètre : le dénominateur commun. */
  effectif_perimetre: z.number().nullable().default(null),
  categories: z.array(OverviewCategorySchema).default([]),
})

export type OverviewCategory = z.infer<typeof OverviewCategorySchema>
export type FeeCategoryOverview = z.infer<typeof FeeCategoryOverviewSchema>
