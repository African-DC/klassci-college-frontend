import {
  Archive,
  ArrowUpFromLine,
  Banknote,
  Bell,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  DoorOpen,
  FileText,
  Gauge,
  GraduationCap,
  HeartHandshake,
  Layers,
  LayoutDashboard,
  Megaphone,
  RotateCcw,
  School,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react"

/**
 * Les icônes que le menu peut nommer.
 *
 * Le modèle de navigation désigne une icône par son nom, pas par le composant :
 * c'est ce qui lui permet de rester une donnée pure, testable sans rendu. La
 * correspondance vit donc ici, avec le modèle, et non dans l'un des deux
 * composants qui l'affichent — sans quoi le second en aurait fait une copie.
 *
 * Une icône absente de cette table rendrait `undefined`, et l'entrée
 * s'afficherait sans pictogramme plutôt que de casser la page.
 */
export const NAV_ICONS = {
  Archive,
  ArrowUpFromLine,
  Banknote,
  Bell,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  DoorOpen,
  FileText,
  Gauge,
  GraduationCap,
  HeartHandshake,
  Layers,
  LayoutDashboard,
  Megaphone,
  RotateCcw,
  School,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  Wallet,
} as const

export type NavIconName = keyof typeof NAV_ICONS
