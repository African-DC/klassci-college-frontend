import type { Route } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/forms/LoginForm"

export default async function LoginPage() {
  const session = await auth()

  if (session?.user && !session.error) {
    const portal = session.user.role ?? "admin"
    redirect(`/${portal}/dashboard` as Route)
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="font-serif text-[1.7rem] font-bold leading-tight text-foreground">
          Bienvenue
        </h1>
        <p className="text-[14px] font-light text-muted-foreground">
          Connectez-vous pour accéder à votre espace de travail.
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-[11px] font-light leading-relaxed text-muted-foreground/60">
        En vous connectant, vous acceptez les conditions d&apos;utilisation
        de la plateforme KLASSCI.
      </p>
    </div>
  )
}
