import { Skeleton } from "@/components/ui/skeleton"

// Affiché pendant que le serveur résout le jeton. Sur une donnée mobile lente,
// c'est l'écran que la personne regarde le plus longtemps : il montre déjà la
// forme de la page, pas un vide.
export default function TeleverserLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-full max-w-xs" />
      </div>
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="mt-auto space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}
