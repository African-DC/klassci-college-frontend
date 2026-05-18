"use client"

import Image from "next/image"
import { Toaster } from "sonner"

interface PortalShellProps {
  label: string
  nav: React.ReactNode
  /** Optional desktop sidebar — when provided, the layout switches to a
   *  sidebar+main row on md+ screens while keeping `nav` as the mobile
   *  bottom-nav. The sidebar component must apply its own `hidden md:flex`
   *  to stay invisible on mobile. */
  sidebar?: React.ReactNode
  children: React.ReactNode
}

export function PortalShell({ label, nav, sidebar, children }: PortalShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {sidebar}
      <div className="flex min-h-screen flex-1 flex-col">
        <header
          className={
            sidebar
              ? "sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden"
              : "sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80"
          }
        >
          <div className="flex flex-col items-center w-fit">
            <Image
              src="/images/logo_klassci.png"
              alt="KLASSCI"
              width={90}
              height={24}
            />
            <span className="font-serif text-[9px] -mt-1.5 text-muted-foreground">
              College
            </span>
          </div>
          <span className="text-[10px] tracking-widest text-muted-foreground uppercase">{label}</span>
        </header>

        <main className="flex-1 px-4 py-4 pb-24 md:px-8 md:py-6 md:pb-8">
          {children}
        </main>

        {nav}
      </div>
      <Toaster richColors />
    </div>
  )
}
