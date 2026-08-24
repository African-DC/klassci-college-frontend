"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUploadUrl } from "@/lib/utils"

interface StudentAvatarProps {
  photoUrl?: string | null
  /** Les initiales affichées tant qu'il n'y a pas de photo, ou si elle manque. */
  initials: string
}

/**
 * La photo d'un élève dans le journal des versements.
 *
 * Trois choses passent par les primitives partagées plutôt que par une copie
 * locale : `getUploadUrl` qui laisse passer une URL déjà absolue au lieu de la
 * préfixer une seconde fois, et `Avatar`/`AvatarFallback` qui retombent seuls
 * sur les initiales quand l'image manque — sans état d'erreur à tenir à la
 * main, et sans balise `img` nue.
 */
export function StudentAvatar({ photoUrl, initials }: StudentAvatarProps) {
  const src = getUploadUrl(photoUrl ?? undefined)
  return (
    <Avatar className="h-8 w-8">
      {/* `object-cover` recadre : une photo d'identité est en 3:4, et sans lui
          Radix la rendrait étirée dans un carré de 32 pixels. */}
      {src ? <AvatarImage src={src} alt="" className="object-cover" /> : null}
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
