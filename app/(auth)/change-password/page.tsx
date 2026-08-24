import { ChangePasswordForm } from "@/components/forms/ChangePasswordForm"

export const metadata = { title: "Changer le mot de passe" }

/**
 * Écran de changement de mot de passe forcé (1re connexion après création ou
 * réinitialisation par un admin). Le middleware y redirige tant que le compte
 * porte `mustChangePassword`. Réutilise la mise en page (auth) avec la photo.
 */
export default function ChangePasswordPage() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="font-serif text-[1.7rem] font-bold leading-tight text-foreground">
          Choisissez un mot de passe
        </h1>
        <p className="text-[14px] font-light text-muted-foreground">
          Pour votre sécurité, remplacez le mot de passe temporaire avant
          d&apos;accéder à votre espace.
        </p>
      </div>

      <ChangePasswordForm />
    </div>
  )
}
