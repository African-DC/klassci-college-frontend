import { AdminShell } from "@/components/shared/AdminShell"

// Toutes les pages admin sont auth-gated (NextAuth session) et dépendent
// de TanStack Query côté client. Le static prerender Next.js 15 n'a pas
// accès à la session → InvariantError "workUnitAsyncStorage". Force dynamic
// rendering pour éviter le static export build-time.
export const dynamic = "force-dynamic"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
