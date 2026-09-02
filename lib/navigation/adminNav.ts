import type { Route } from "next"

export interface AdminNavItem {
  label: string
  href: Route
  iconName: string
  anyOf: string[]
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
      { label: "Paiements", href: "/admin/payments", iconName: "CreditCard", anyOf: ["payments:read"] },
      // Le tableau des soldes vit sous Paiements, gardé sur le même droit :
      // il ne montre pas un franc de plus que le journal, autrement rangé.
      { label: "Soldes par classe", href: "/admin/payments/soldes" as Route, iconName: "ClipboardCheck", anyOf: ["payments:read"] },
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

export function canSeeAdminNavItem(item: AdminNavItem, permissions: Iterable<string>): boolean {
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
      items: section.items.filter((item) => canSeeAdminNavItem(item, permissions)),
    }))
    .filter((section) => section.items.length > 0)
}



