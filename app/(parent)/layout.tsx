"use client"

import { GraduationCap } from "lucide-react"
import { ParentNav } from "@/components/shared/ParentNav"
import { Toaster } from "@/components/ui/toaster"

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none">KLASSCI</p>
          <p className="text-[9px] tracking-widest text-muted-foreground uppercase">Parent</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        {children}
      </main>

      <ParentNav />
      <Toaster />
    </div>
  )
}
