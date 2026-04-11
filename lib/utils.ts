import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Construit l'URL absolue d'un fichier servi par le backend (photos, uploads, etc.) */
export function getUploadUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (path.startsWith("http")) return path
  const base = process.env.NEXT_PUBLIC_API_URL ?? ""
  return `${base}${path}`
}

/** Déclenche le téléchargement d'un Blob côté navigateur */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}


/** Couleur Tailwind pour la mention du bulletin (format ivoirien) */
export function getMentionColor(mention: string | null): string {
  if (!mention) return "text-muted-foreground"
  switch (mention) {
    case "TB":
      return "text-emerald-600 dark:text-emerald-400"
    case "B":
      return "text-primary"
    case "AB":
      return "text-accent"
    case "P":
      return "text-amber-600 dark:text-amber-400"
    case "M":
      return "text-destructive"
    default:
      return "text-muted-foreground"
  }
}
