import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Couleur Tailwind pour la mention du bulletin (format ivoirien) */
export function getMentionColor(mention: string | null): string {
  if (!mention) return "text-muted-foreground"
  switch (mention) {
    case "Très Bien":
      return "text-emerald-600 dark:text-emerald-400"
    case "Bien":
      return "text-primary"
    case "Assez Bien":
      return "text-accent"
    case "Passable":
      return "text-amber-600 dark:text-amber-400"
    default:
      return "text-muted-foreground"
  }
}
