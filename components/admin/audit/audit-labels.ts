/**
 * Traduction des identifiants techniques du journal.
 *
 * Le backend envoie `enrollment_installment_plan` ; la directrice lit
 * « Échéancier négocié ». La présentation vit ici, pas côté serveur.
 */

const ENTITY_LABELS: Record<string, string> = {
  academic_year: "Année scolaire",
  attendance_session: "Appel",
  bulk_promotion: "Promotion de classe",
  bulletin: "Bulletin",
  cash_session: "Journée de caisse",
  class: "Classe",
  council_minutes: "Conseil de classe",
  council_student_decision: "Décision de conseil",
  document_attestation: "Attestation de fréquentation",
  document_certificat: "Certificat de scolarité",
  document_issuance: "Document officiel",
  document_release_override: "Dérogation sur document",
  enrollment: "Inscription",
  enrollment_installment_plan: "Échéancier négocié",
  evaluation: "Évaluation",
  fee_category: "Catégorie de frais",
  fee_installment_grid: "Grille de tranches",
  fee_variant: "Montant de frais",
  grade: "Note",
  level: "Niveau",
  optional_fee_option: "Frais optionnel",
  parent: "Parent",
  parent_student: "Lien parent-élève",
  payment: "Versement",
  role: "Rôle",
  room: "Salle",
  school_holidays: "Congés scolaires",
  school_settings: "Paramètres de l'école",
  series: "Série",
  staff: "Personnel",
  student: "Élève",
  student_option: "Option d'un élève",
  subject: "Matière",
  teacher: "Enseignant",
  teacher_session_attendance: "Pointage enseignant",
  timetable_slot: "Créneau d'emploi du temps",
  trimesters: "Trimestres",
  user: "Compte utilisateur",
}

const ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  read: "Consultation",
  login: "Connexion",
  logout: "Déconnexion",
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  director: "Directeur",
  studies_director: "Directeur des études",
  accountant: "Comptable",
  cashier: "Caissier",
  educator: "Éducateur",
  staff: "Secrétariat",
  teacher: "Enseignant",
  parent: "Parent",
  student: "Élève",
  super_admin: "Super-administrateur",
}

export function entityLabel(slug: string): string {
  return knowsEntity(slug) ? ENTITY_LABELS[slug] : slug.replaceAll("_", " ")
}

/**
 * Ce catalogue connait-il ce type d'entite ?
 *
 * `entityLabel` retombe sur le slug desossé quand elle ne sait pas, ce qui se
 * lit comme une traduction alors que c'en est une invention. Qui derive un
 * libelle a partir d'un type doit donc pouvoir demander d'abord.
 */
export function knowsEntity(slug: string): boolean {
  // `hasOwn`, pas `in` : `in` remonte la chaine des prototypes, et
  // `knowsEntity("constructor")` rendait vrai, puis `entityLabel` une fonction
  // la ou son type promet une chaine.
  return Object.hasOwn(ENTITY_LABELS, slug)
}

/**
 * Le verbe, pour raconter la ligne en une phrase : « Sophie Yao a modifie... ».
 *
 * A cote du nom de l'action, et non dans le dialogue qui s'en sert : les deux
 * listes portent les memes six cles, et deux listes finissent par diverger.
 */
const ACTION_VERBS: Record<string, string> = {
  create: "a créé",
  update: "a modifié",
  delete: "a supprimé",
  read: "a consulté",
  login: "s'est connecté",
  logout: "s'est déconnecté",
}

export function actionVerb(slug: string): string {
  return ACTION_VERBS[slug] ?? actionLabel(slug).toLowerCase()
}

export function actionLabel(slug: string): string {
  return ACTION_LABELS[slug] ?? slug
}

export function roleLabel(slug: string | null | undefined): string | null {
  if (!slug) return null
  return ROLE_LABELS[slug] ?? slug
}

/**
 * Une consultation ne se lit pas comme une suppression : la couleur doit
 * porter la gravité, pas décorer.
 */
export function actionTone(slug: string): "success" | "warning" | "danger" | "neutral" | "primary" {
  switch (slug) {
    case "create":
      return "success"
    case "update":
      return "warning"
    case "delete":
      return "danger"
    case "read":
      return "neutral"
    default:
      return "primary"
  }
}

export function formatStamp(iso: string): { date: string; time: string } {
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return { date: iso, time: "" }
  return {
    date: value.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
    time: value.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  }
}
