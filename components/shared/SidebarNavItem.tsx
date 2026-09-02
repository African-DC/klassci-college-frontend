"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { correspond, plusPrecise } from "@/lib/navigation/active"
import { NAV_ICONS, type NavIconName } from "@/lib/navigation/icons"
import { estUnGroupe, type AdminNavItem, type AdminNavLink } from "@/lib/navigation/adminNav"

const LIGNE = "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
const ACTIVE =
  "bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-accent before:content-['']"
const INACTIVE = "text-muted-foreground hover:bg-muted hover:text-foreground"

function Icone({ nom, actif }: { nom: string; actif: boolean }) {
  const Composant = NAV_ICONS[nom as NavIconName]
  if (!Composant) return null
  return <Composant className={cn("h-4 w-4 shrink-0", actif && "text-primary")} />
}

function Entree({
  item,
  actif,
  onNavigate,
  indente,
}: {
  item: AdminNavLink
  actif: boolean
  onNavigate?: () => void
  indente?: boolean
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={actif ? "page" : undefined}
      className={cn(LIGNE, actif ? ACTIVE : INACTIVE, indente && "pl-9")}
    >
      <Icone nom={item.iconName} actif={actif} />
      {item.label}
    </Link>
  )
}

/**
 * Une entrée du menu, qu'elle mène quelque part ou qu'elle en contienne d'autres.
 *
 * Sortie de la barre latérale pour que celle-ci reste lisible : elle assemble
 * un menu, elle n'a pas à savoir ce qu'est un groupe dépliant.
 *
 * **Le groupe s'ouvre de lui-même quand on est dedans.** Arriver sur les soldes
 * par un lien et trouver le menu replié sur « Caisse » laisserait croire qu'on
 * est ailleurs — et refermer un groupe dont on lit une page serait pire encore.
 * On ne mémorise donc pas l'état plié : l'endroit où l'on se trouve le décide,
 * et l'utilisateur peut toujours l'ouvrir ou le fermer à la main.
 */
export function SidebarNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: AdminNavItem
  pathname: string
  onNavigate?: () => void
}) {
  const chemins = estUnGroupe(item) ? item.children.map((c) => c.href as string) : []
  const dedans = chemins.some((href) => correspond(pathname, href))
  const [ouvertAlaMain, setOuvertAlaMain] = useState<boolean | null>(null)
  const ouvert = ouvertAlaMain ?? dedans

  if (!estUnGroupe(item)) {
    return <Entree item={item} actif={correspond(pathname, item.href)} onNavigate={onNavigate} />
  }

  // Le chemin le plus précis gagne : sans cela, le journal des versements
  // s'allumerait aussi sur la page des soldes, qui est sous lui.
  const gagnant = plusPrecise(pathname, chemins)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOuvertAlaMain(!ouvert)}
        aria-expanded={ouvert}
        className={cn(LIGNE, "w-full", dedans ? "font-medium text-foreground" : INACTIVE)}
      >
        <Icone nom={item.iconName} actif={dedans} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          aria-hidden
          className={cn("h-4 w-4 shrink-0 transition-transform", ouvert && "rotate-180")}
        />
      </button>
      {ouvert && (
        <div className="mt-1 space-y-1">
          {item.children.map((enfant) => (
            <Entree
              key={enfant.href}
              item={enfant}
              actif={enfant.href === gagnant}
              onNavigate={onNavigate}
              indente
            />
          ))}
        </div>
      )}
    </div>
  )
}
