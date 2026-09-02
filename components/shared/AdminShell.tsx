"use client"

import { useState } from "react"
import { Toaster } from "sonner"
import { Sidebar } from "@/components/shared/Sidebar"
import { Navbar } from "@/components/shared/Navbar"
import { AcademicYearProvider } from "@/components/shared/AcademicYearProvider"
import { NoCurrentYearBanner } from "@/components/shared/NoCurrentYearBanner"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AcademicYearProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
            <NoCurrentYearBanner />
            {children}
          </main>
        </div>

        <Toaster richColors />
      </div>
    </AcademicYearProvider>
  )
}
