import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryLedgerClient } from "@/components/admin/payments/settlement/CategoryLedgerClient"

/**
 * L'écran porte ses filtres dans l'adresse — c'est ce qui rend le lien
 * partageable et le bouton retour utile. Il lit donc `useSearchParams`, et
 * Next.js exige alors une frontière Suspense : sans elle, le build échoue sur
 * le rendu statique.
 */
export default function SoldesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4 md:p-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      }
    >
      <CategoryLedgerClient />
    </Suspense>
  )
}
