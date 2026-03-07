import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/forms/LoginForm"

export default async function LoginPage() {
  const session = await auth()

  if (session?.user && !session.error) {
    const portal = session.user.role ?? "admin"
    redirect(`/${portal}/dashboard` as never)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bienvenue
        </h1>
        <p className="text-muted-foreground">
          Connectez-vous pour acceder a votre espace
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-xs text-muted-foreground">
        En vous connectant, vous acceptez les conditions d&apos;utilisation
        de la plateforme KLASSCI.
      </p>
    </div>
  )
}
