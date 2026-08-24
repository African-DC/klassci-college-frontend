import { Banknote, Building2, FileText, Smartphone, Wallet } from "lucide-react"

type IconComponent = React.ComponentType<{ className?: string }>

/**
 * Une icône par moyen de paiement.
 *
 * Les quatre opérateurs mobile money partagent l'icône du téléphone : c'est le
 * geste commun, et quatre pictogrammes différents dans une même colonne
 * rendraient le tableau plus bruyant sans rien apprendre. Le libellé, lui,
 * nomme bien l'opérateur.
 */
const ICONS: Record<string, IconComponent> = {
  cash: Banknote,
  wave: Smartphone,
  mtn_momo: Smartphone,
  orange_money: Smartphone,
  moov_money: Smartphone,
  bank_transfer: Building2,
  cheque: FileText,
  mobile_money: Smartphone,
}

/**
 * Icône d'un moyen, avec un repli neutre.
 *
 * Le repli ne masque rien : le libellé affiché à côté reste la clé brute quand
 * le moyen est inconnu, c'est lui qui porte l'information.
 */
export function paymentMethodIcon(key: string): IconComponent {
  return ICONS[key] ?? Wallet
}
