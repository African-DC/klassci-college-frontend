"use client"

import { useSession } from "next-auth/react"
import { CalendarDays } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

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

  const rawName = session?.user?.email?.split("@")[0] ?? "Administrateur"
  // Capitalise et prend la partie avant . ou _ (jean.mbala → Jean)
  const firstName = rawName.split(/[._]/)[0].replace(/^\w/, (c) => c.toUpperCase())

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-sm sm:p-8">
      {/* Decorative circles */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute right-1/4 top-1/2 h-20 w-20 rounded-full bg-white/[0.03]" />

      <div className="relative z-10 space-y-2">
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          Bonjour, {firstName}
        </h1>
        <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
          <CalendarDays className="h-4 w-4" />
          <span className="capitalize" suppressHydrationWarning>{today}</span>
        </div>
        <p className="text-sm text-primary-foreground/60 max-w-lg">
          Voici un aperçu de votre établissement. Consultez les indicateurs clés et les activités récentes.
        </p>
      </div>
    </div>
  )
}

export function WelcomeHeaderSkeleton() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 sm:p-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 bg-white/20" />
        <Skeleton className="h-4 w-48 bg-white/15" />
        <Skeleton className="h-4 w-80 bg-white/10" />
      </div>
    </div>
  )
}
