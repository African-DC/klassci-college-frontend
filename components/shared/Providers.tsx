"use client"

import { useState } from "react"
import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { SessionKeepAlive } from "./SessionKeepAlive"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    // refetchOnWindowFocus : revenir sur l'onglet re-lit la session (et
    // rafraîchit l'access token si besoin). Le refresh périodique et la
    // déconnexion sur inactivité sont pilotés par SessionKeepAlive.
    <SessionProvider refetchOnWindowFocus>
      <SessionKeepAlive />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
