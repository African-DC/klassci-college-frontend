import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Affiché pendant que la vérification serveur se résout (streaming SSR).
export default function VerifierLoading() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3 bg-muted/40 p-6">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto h-5 w-48" />
        <Skeleton className="mx-auto h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
        <Skeleton className="h-16 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}
