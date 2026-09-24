/**
 * Le logo de l'établissement, prêt à entrer dans un export.
 *
 * Excel et PDF n'acceptent qu'une image embarquée (PNG ou JPEG), pas une URL.
 * Le logo téléversé peut être un WebP, un SVG, ou une photo de plusieurs
 * mégaoctets prise au téléphone : on le redessine en PNG de taille raisonnable,
 * ce qui règle le format et le poids d'un coup.
 *
 * Un logo illisible ne doit jamais coûter l'export lui-même : la secrétaire a
 * besoin de sa liste, le logo l'habille. En cas d'échec, l'export part sans
 * logo, et la console le dit.
 */

import { getUploadUrl } from "@/lib/utils"
import type { ExportBranding } from "./types"

/** Côté le plus long du logo redessiné, en pixels : net à l'impression, léger. */
const TAILLE_MAX = 256

function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Logo illisible : ${src}`))
    image.src = src
  })
}

/** Redessine une image en PNG dont le plus grand côté vaut au plus `TAILLE_MAX`. */
export function versPng(image: HTMLImageElement): string {
  const echelle = Math.min(1, TAILLE_MAX / Math.max(image.naturalWidth, image.naturalHeight, 1))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(image.naturalWidth * echelle))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * echelle))
  const contexte = canvas.getContext("2d")
  if (!contexte) throw new Error("Dessin du logo impossible dans ce navigateur")
  contexte.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/png")
}

/**
 * La marque, avec son logo embarqué quand les paramètres en déclarent un.
 *
 * `charger` est remplaçable en test : le chargement réel passe par le DOM.
 */
export async function withLogo(
  branding: ExportBranding,
  charger: (src: string) => Promise<string> = async (src) => versPng(await chargerImage(src)),
): Promise<ExportBranding> {
  if (branding.logoDataUrl || !branding.logoUrl) return branding
  const src = getUploadUrl(branding.logoUrl)
  if (!src) return branding
  try {
    return { ...branding, logoDataUrl: await charger(src) }
  } catch (err) {
    console.warn("Export sans logo :", err)
    return branding
  }
}
