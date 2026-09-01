import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { InKindBatchClient } from "@/components/admin/enrollments/batch/InKindBatchClient"

/**
 * `useSearchParams` lit la classe passée dans le lien, et Next.js exige alors
 * une frontière Suspense : sans elle le build échoue sur le rendu statique.
 */
export default function SaisieClassePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4 md:p-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      }
    >
      <InKindBatchClient />
    </Suspense>
  )
}
