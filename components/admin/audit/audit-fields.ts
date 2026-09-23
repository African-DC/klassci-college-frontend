/**
 * Traduire une ligne de journal en français lisible.
 *
 * Le backend écrit ce qu'il manipule : `enrollment_fee_id`, `mobile_money`,
 * `50000.00`. La secrétaire lit « Frais concerné », « Mobile Money »,
 * « 50 000 FCFA ». La traduction vit ici, pas côté serveur : un journal doit
 * enregistrer la valeur, pas sa présentation.
 */

import { entityLabel, knowsEntity } from "./audit-labels"

/**
 * Noms de champs que l'on ne sait pas déduire.
 *
 * Une clé en `*_id` n'y figure que si le catalogue d'entités ne connait pas
 * son type : sinon son nom se déduit de `audit-labels.ts`, et le recopier
 * ferait deux sources pour un même mot, ce par quoi la dérive commence.
 */
const FIELD_LABELS: Record<string, string> = {
  address: "Adresse",
  allocation_mode: "Mode de répartition",
  allocations: "Répartition",
  amount: "Montant",
  approved: "Approuvé",
  archived: "Archivé",
  arrears_amount: "Arriérés",
  assignment_scope: "Portée",
  birth_date: "Date de naissance",
  business_date: "Journée comptable",
  cancellation_reason: "Motif d'annulation",
  capacity: "Capacité",
  // `cashier_email` ne finit pas par `_id`, donc rien à déduire.
  cashier_email: "Caissier",
  coefficient: "Coefficient",
  counted_amount: "Montant compté",
  day: "Jour",
  description: "Description",
  directed_allocations: "Répartition demandée",
  due_date: "Échéance",
  email: "Adresse e-mail",
  end_date: "Date de fin",
  end_time: "Fin",
  // `enrollment_fee` n'est pas un type du catalogue : sans cette ligne, la
  // répartition d'un versement, la plus consultée du journal, affiche
  // « enrollment fee ».
  enrollment_fee_id: "Frais concerné",
  enrollment_number: "Matricule",
  enrollment_profile: "Profil d'inscription",
  expected_amount: "Montant attendu",
  final_decision: "Décision finale",
  first_name: "Prénom",
  genre: "Sexe",
  hours_per_week: "Heures par semaine",
  installments: "Tranches",
  is_current: "Année en cours",
  is_published: "Publié",
  is_validated: "Validé",
  last_name: "Nom",
  late_minutes: "Retard (minutes)",
  logo_url: "Logo",
  max_students: "Effectif maximum",
  method: "Moyen de paiement",
  name: "Nom",
  notes: "Notes",
  order: "Ordre",
  override_reason: "Motif de dérogation",
  percentage: "Pourcentage",
  phone: "Téléphone",
  photo_url: "Photo",
  position: "Rang",
  quantity: "Quantité",
  reason: "Motif",
  reference: "Référence",
  relationship_type: "Lien de parenté",
  role: "Rôle",
  role_name: "Rôle",
  room_type: "Type de salle",
  signature_image_url: "Signature",
  start_date: "Date de début",
  start_time: "Début",
  status: "Statut",
  student_name: "Élève",
  trimester: "Trimestre",
  value: "Note",
  variance: "Écart",
}

/** Valeurs d'énumération telles que le métier les nomme. */
const VALUE_LABELS: Record<string, string> = {
  // Moyens de paiement
  cash: "Espèces",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement bancaire",
  check: "Chèque",
  cheque: "Chèque",
  // Statuts de frais et de versement
  pending: "En attente",
  partial: "Partiel",
  paid: "Payé",
  waived: "Exonéré",
  in_kind: "Dépôt en nature",
  completed: "Terminé",
  cancelled: "Annulé",
  // Inscriptions
  prospect: "Dossier ouvert",
  en_validation: "En validation",
  valide: "Validée",
  rejete: "Rejetée",
  // Liens de parenté
  pere: "Père",
  mere: "Mère",
  tuteur: "Tuteur",
  // Divers
  F: "Féminin",
  M: "Masculin",
  manual: "Répartition manuelle",
  cascade: "Répartition automatique",
  classroom: "Salle de classe",
  laboratory: "Laboratoire",
  computer_lab: "Salle informatique",
}

const AMOUNT_KEYS = new Set([
  "amount",
  "arrears_amount",
  "block_threshold_xof",
  "counted_amount",
  "debt_delta",
  "expected_amount",
  "late_amount",
  "variance",
])

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+)?/

export function fieldLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]
  // Seulement sur un type que le catalogue connait : sinon `entityLabel`
  // rendrait « enrollment fee », qui a l'air traduit et ne l'est pas.
  const sansSuffixe = key.endsWith("_id") ? key.slice(0, -3) : null
  if (sansSuffixe && knowsEntity(sansSuffixe)) return entityLabel(sansSuffixe)
  const base = key.replaceAll("_", " ")
  return base.charAt(0).toUpperCase() + base.slice(1)
}

function amount(value: number | string): string {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return String(value)
  return `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`
}

/**
 * Une valeur de journal, prête à l'affichage.
 *
 * Deux formes, nommées : un texte qui se pose dans une cellule, ou une
 * structure (répartition d'un versement, tranches d'un échéancier) que seul
 * du JSX rend lisible. La frontière est explicite parce que la version
 * précédente la cachait dans un `null` de retour, et l'appelant qui écrivait
 * `?? "…"` faisait disparaître la donnée.
 */
export type RenderedValue =
  | { kind: "text"; text: string }
  | { kind: "structured"; value: unknown }

export function formatValue(key: string, value: unknown): RenderedValue {
  if (value === null || value === undefined || value === "") {
    return { kind: "text", text: "—" }
  }
  if (typeof value === "boolean") return { kind: "text", text: value ? "Oui" : "Non" }
  if (typeof value === "object") return { kind: "structured", value }

  const brut = String(value)
  if (AMOUNT_KEYS.has(key) || key.endsWith("_amount") || key.endsWith("_xof")) {
    return { kind: "text", text: amount(brut) }
  }
  if (VALUE_LABELS[brut]) return { kind: "text", text: VALUE_LABELS[brut] }
  if (ISO_DATE.test(brut)) {
    const parsed = new Date(brut)
    if (!Number.isNaN(parsed.getTime())) {
      return {
        kind: "text",
        text: parsed.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      }
    }
  }
  return { kind: "text", text: brut }
}

/**
 * Ce que le lecteur verrait, pour décider si un champ a changé.
 *
 * Le tableau ne promet qu'une chose : ne montrer que ce qui a bougé. Comparer
 * les valeurs brutes laisserait passer une ligne dont les deux cellules
 * affichent « 50 000 FCFA » à l'identique.
 */
export function comparableValue(key: string, value: unknown): string {
  const rendu = formatValue(key, value)
  return rendu.kind === "text" ? rendu.text : JSON.stringify(rendu.value)
}

/**
 * Le libellé d'une fiche liée, quand la ligne en porte un.
 *
 * Les valeurs numériques en `*_id` restent des identifiants : le journal ne
 * résout rien à la lecture (le nom est figé à l'écriture, côté serveur). Mais
 * quand l'entité liée est déjà nommée dans la ligne, on montre le nom.
 */
export function relatedLabel(
  key: string,
  value: unknown,
  related:
    | readonly { type?: string | null; id?: number | null; label?: string | null }[]
    | null
    | undefined,
): string | null {
  if (!related?.length || typeof value !== "number") return null
  const type = key.replace(/_id$/, "")
  const match = related.find((entry) => entry.type === type && entry.id === value)
  return match?.label ?? null
}
