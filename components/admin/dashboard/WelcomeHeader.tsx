"use client"

import { useSession } from "next-auth/react"
import { CalendarDays } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { greetingName } from "@/lib/utils/session-identity"

export function WelcomeHeader() {
  const { data: session, status } = useSession()

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  if (status === "loading") {
    return <WelcomeHeaderSkeleton />
  }

  // Le prénom réel quand la session le porte ; sinon le début de l'adresse
  // e-mail, mis en forme, pour les sessions ouvertes avant qu'il n'y transite.
  const firstName = greetingName(session?.user)
    .split(/[._]/)[0]
    .replace(/^\w/, (c) => c.toUpperCase())

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
            Bonjour, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Aperçu de votre établissement et des activités récentes.
          </p>
        </div>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          <span className="capitalize" suppressHydrationWarning>
            {today}
          </span>
        </span>
      </div>
      <Separator />
    </div>
  )
}

export function WelcomeHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-4 w-40" />
      </div>
      <Separator />
    </div>
  )
}
