import type { Route } from "next"

/** Une entrée qui mène quelque part. */
export interface AdminNavLink {
  label: string
  href: Route
  iconName: string
  anyOf: string[]
}

/**
 * Une entrée qui en contient d'autres, et ne mène nulle part elle-même.
 *
 * Union discriminée plutôt qu'un `href` rendu facultatif : un lien sans
 * destination n'existe pas, et le rendre possible dans le type obligerait
 * chaque lecture du menu à se demander si celui-là en a une.
 */
export interface AdminNavGroup {
  label: string
  iconName: string
  anyOf: string[]
  children: AdminNavLink[]
}

export type AdminNavItem = AdminNavLink | AdminNavGroup

export function estUnGroupe(item: AdminNavItem): item is AdminNavGroup {
  return "children" in item
}

export interface AdminNavSection {
  title: string
  items: AdminNavItem[]
}

export const ADMIN_NAVIGATION: AdminNavSection[] = [
  {
    title: "Principal",
    items: [{ label: "Dashboard", href: "/admin/dashboard", iconName: "LayoutDashboard", anyOf: [] }],
  },
  {
    title: "Scolarité",
    items: [
      { label: "Inscriptions", href: "/admin/enrollments", iconName: "UserPlus", anyOf: ["enrollments:read"] },
      // Saisie en lot : gardee sur `enrollments:update` et non sur `read`, parce
      // qu'un ecran ou chaque bouton rendrait 403 est pire que pas d'entree du tout.
      { label: "Saisie par classe", href: "/admin/enrollments/saisie-classe" as Route, iconName: "ClipboardList", anyOf: ["enrollments:update"] },
      { label: "Promotions", href: "/admin/promotions" as Route, iconName: "ArrowUpFromLine", anyOf: ["enrollments:promote"] },
      { label: "Élèves", href: "/admin/students", iconName: "GraduationCap", anyOf: ["admin:students:read"] },
      { label: "Parents", href: "/admin/parents" as Route, iconName: "HeartHandshake", anyOf: ["admin:parents:read"] },
      { label: "Enseignants", href: "/admin/teachers", iconName: "Users", anyOf: ["admin:teachers:read"] },
      { label: "Personnel", href: "/admin/staff", iconName: "UserCog", anyOf: ["admin:staff:read"] },
    ],
  },
  {
    title: "Académique",
    items: [
      { label: "Années scolaires", href: "/admin/academic-years" as Route, iconName: "CalendarRange", anyOf: ["admin:academic-years:read"] },
      { label: "Niveaux & Séries", href: "/admin/levels" as Route, iconName: "Layers", anyOf: ["admin:levels:read", "admin:series:read"] },
      { label: "Classes", href: "/admin/classes", iconName: "School", anyOf: ["admin:classes:read"] },
      { label: "Salles", href: "/admin/rooms" as Route, iconName: "DoorOpen", anyOf: ["admin:rooms:read"] },
      { label: "Matières", href: "/admin/subjects", iconName: "BookOpen", anyOf: ["admin:subjects:read"] },
    ],
  },
  {
    title: "Finances",
    items: [
      { label: "Frais", href: "/admin/fees", iconName: "Wallet", anyOf: ["admin:fee-categories:read", "admin:fee-variants:read"] },
      // Deux lectures de la même caisse : ce qui est entré, et ce qui reste dû.
      // Elles se répondent, et les séparer obligeait à chercher la seconde
      // ailleurs que là où la première pose la question.
      {
        label: "Caisse",
        iconName: "CreditCard",
        anyOf: ["payments:read"],
        children: [
          { label: "Journal des versements", href: "/admin/payments", iconName: "CreditCard", anyOf: ["payments:read"] },
          { label: "Soldes par catégorie", href: "/admin/payments/soldes" as Route, iconName: "ClipboardCheck", anyOf: ["payments:read:all"] },
        ],
      },
      // Gardé sur `payments:read:all`, pas sur `payments:read`. Ce tableau dit
      // ce qu'une famille doit encore, ce qui se calcule sur tout l'argent
      // reçu : cloisonné à une caisse, il afficherait « Dû » sur une famille
      // qui a payé au guichet d'à côté. Le serveur le refuse, le menu ne doit
      // donc pas le proposer — un lien qui mène à un 403 n'aide personne.
      { label: "Tranches", href: "/admin/installments" as Route, iconName: "CalendarClock", anyOf: ["admin:fee-installments:read"] },
      // Ma caisse : réservée à qui tient un guichet. Le comptable ne l'a pas,
      // il supervise depuis le point journalier.
      { label: "Ma caisse", href: "/admin/cash" as Route, iconName: "Banknote", anyOf: ["cash-session:manage"] },
      { label: "Point journalier", href: "/admin/cash-point" as Route, iconName: "ClipboardCheck", anyOf: ["cash-session:read:all"] },
    ],
  },
  {
    title: "Suivi",
    items: [
      { label: "Emploi du temps", href: "/admin/timetable", iconName: "CalendarDays", anyOf: ["timetable:read"] },
      { label: "Notes", href: "/admin/grades", iconName: "ClipboardList", anyOf: ["grades:read"] },
      { label: "Présences", href: "/admin/attendance", iconName: "UserCheck", anyOf: ["attendance:read"] },
      // Actes de vie scolaire : les deux entrées vont ensemble, portées par le
      // bureau de la vie scolaire, éducateur et secrétariat. Le directeur des
      // études ne les a pas : il signe la demande de dossier scolaire, l'acte
      // qui correspond avec l'établissement d'origine.
      { label: "Convocations", href: "/admin/summons" as Route, iconName: "Megaphone", anyOf: ["documents:parent-summons"] },
      { label: "Autorisations de reprise", href: "/admin/retakes" as Route, iconName: "RotateCcw", anyOf: ["documents:zero-cancellation"] },
      { label: "Bulletins", href: "/admin/reports", iconName: "FileText", anyOf: ["reports:read", "bulletins:generate"] },
      { label: "Performance", href: "/admin/performance" as Route, iconName: "Gauge", anyOf: ["performance:read"] },
      { label: "Congés", href: "/admin/leave" as Route, iconName: "CalendarClock", anyOf: ["leave:approve"] },
    ],
  },
  {
    title: "Système",
    items: [
      { label: "Notifications", href: "/admin/notifications", iconName: "Bell", anyOf: [] },
      { label: "Rôles & Permissions", href: "/admin/roles", iconName: "ShieldCheck", anyOf: ["admin:roles:read"] },
      { label: "Journal d'audit", href: "/admin/audit" as Route, iconName: "ScrollText", anyOf: ["audit:read", "audit:read:financial"] },
      // La corbeille n'a de sens que pour qui peut la lire : la donner à tout
      // le monde laisserait croire qu'une fiche disparue est récupérable par
      // n'importe qui, alors que restaurer et purger sont des droits distincts.
      { label: "Corbeille", href: "/admin/archive" as Route, iconName: "Archive", anyOf: ["archive:read"] },
      { label: "Paramètres", href: "/admin/settings" as Route, iconName: "Settings", anyOf: ["admin:academic-years:read"] },
    ],
  },
]

export function canSeeAdminNavItem(item: AdminNavLink, permissions: Iterable<string>): boolean {
  if (item.anyOf.length === 0) return true
  const set = permissions instanceof Set ? permissions : new Set(permissions)
  return item.anyOf.some((slug) => set.has(slug))
}

export function filterAdminNavigation(
  permissions: Iterable<string> | null | undefined,
  navigation: AdminNavSection[] = ADMIN_NAVIGATION,
): AdminNavSection[] {
  if (permissions == null) return []
  return navigation
    .map((section) => ({
      ...section,
      // Un groupe se juge sur ses enfants : le montrer vide ferait un bouton
      // qui s'ouvre sur rien, et le cacher alors qu'un enfant est permis
      // rendrait cet enfant introuvable.
      items: section.items
        .map((item) =>
          estUnGroupe(item)
            ? { ...item, children: item.children.filter((c) => canSeeAdminNavItem(c, permissions)) }
            : item,
        )
        .filter((item) =>
          estUnGroupe(item) ? item.children.length > 0 : canSeeAdminNavItem(item, permissions),
        ),
    }))
    .filter((section) => section.items.length > 0)
}



