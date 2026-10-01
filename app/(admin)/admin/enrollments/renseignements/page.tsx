import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfileBatchClient } from "@/components/admin/enrollments/profiles-batch/ProfileBatchClient"

/**
 * `useSearchParams` lit la classe passée dans le lien : Next.js exige alors
 * une frontière Suspense, sans quoi le rendu statique échoue.
 */
export default function SaisieRenseignementsPage() {
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
      <ProfileBatchClient />
    </Suspense>
  )
}
