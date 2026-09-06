import { z } from "zod"

// Miroir de `app/schemas/arrears_policy.py` et de l'enum `ArrearsPolicy`
// (`app/models/academic.py`).

/**
 * Ce que l'établissement décide de faire d'une dette d'un exercice précédent.
 *
 * `off` est le défaut, et c'est l'identité : ni mention au guichet, ni refus.
 * Une école qui n'ouvre jamais cet écran ne voit aucun changement.
 */
export const ArrearsPolicyValueSchema = z.enum(["off", "inform", "block"])

export type ArrearsPolicyValue = z.infer<typeof ArrearsPolicyValueSchema>

/**
 * L'état du réglage, tel que le serveur le rend.
 *
 * Les deux champs portent un repli parce qu'un contrat qui exige un champ
 * absent fait échouer la réponse ENTIÈRE : l'écran n'afficherait plus rien du
 * tout au lieu d'afficher le défaut. Et le repli ne peut être que `off` et
 * `0` — les valeurs qui ne font rien.
 */
export const ArrearsPolicySettingsSchema = z.object({
  arrears_policy: ArrearsPolicyValueSchema.catch("off"),
  arrears_block_threshold_xof: z.coerce.number().catch(0),
})

export type ArrearsPolicySettings = z.infer<typeof ArrearsPolicySettingsSchema>

/**
 * Le PUT énonce la politique entière : les deux champs sont requis côté
 * serveur, et un corps incomplet sort en 422 plutôt qu'en écriture à moitié.
 */
export interface ArrearsPolicyUpdate {
  arrears_policy: ArrearsPolicyValue
  arrears_block_threshold_xof: number
}

/**
 * Ce que chaque choix fait, dit au présent et sans jargon.
 *
 * La secrétaire qui lit cet écran doit comprendre ce qui changera au guichet
 * demain matin : les phrases parlent donc de la réinscription qu'elle saisit,
 * jamais de politique, de seuil ni de permission.
 */
export const ARREARS_POLICY_CHOICES: {
  value: ArrearsPolicyValue
  label: string
  effect: string
  /** Le seuil ne sert qu'à ce choix-là. Les autres le gardent sans l'appliquer. */
  usesThreshold: boolean
}[] = [
  {
    value: "off",
    label: "Ignorer",
    effect:
      "La réinscription se passe comme aujourd'hui : rien n'est affiché sur ce qui reste dû au titre des années précédentes.",
    usesThreshold: false,
  },
  {
    value: "inform",
    label: "Informer",
    effect:
      "Le guichet voit ce qui reste dû au titre des années précédentes avant de réinscrire, et réinscrit quand même.",
    usesThreshold: false,
  },
  {
    value: "block",
    label: "Bloquer",
    effect:
      "Au-delà du seuil ci-dessous, la réinscription est refusée ; seules les personnes autorisées passent outre, en écrivant un motif qui reste dans le journal.",
    usesThreshold: true,
  },
]

export function arrearsPolicyLabel(value: ArrearsPolicyValue): string {
  return ARREARS_POLICY_CHOICES.find((choice) => choice.value === value)?.label ?? "Ignorer"
}
