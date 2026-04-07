"use client"

import { useSession } from "next-auth/react"
import { CalendarDays, GraduationCap } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"

export function WelcomeHeader() {
  const { data: session, status } = useSession()
  const { data: yearsData } = useAcademicYears()

  const currentYear = yearsData?.items?.find((y) => y.is_current)

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
  const firstName = rawName.split(/[._]/)[0].replace(/^\w/, (c) => c.toUpperCase())

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-sm sm:p-8">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute right-1/4 top-1/2 h-20 w-20 rounded-full bg-white/[0.03]" />

      <div className="relative z-10 space-y-2">
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          Bonjour, {firstName}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-foreground/70">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="capitalize" suppressHydrationWarning>{today}</span>
          </span>
          {currentYear && (
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-primary-foreground">
              <GraduationCap className="h-3.5 w-3.5" />
              Année {currentYear.name}
            </span>
          )}
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
