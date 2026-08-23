/**
 * Un identifiant ne doit jamais pouvoir partir dans une URL.
 *
 * Ces formulaires sont soumis par React. Mais entre l'affichage du HTML et
 * l'hydratation, le bouton existe déjà et React n'écoute pas encore : un clic
 * dans cet intervalle déclenche la soumission native du navigateur. Sans
 * `method`, celle-ci est un GET, et les champs partent en paramètres d'URL,
 * donc dans l'historique, dans les journaux du serveur et dans l'en-tête
 * Referer de la page suivante.
 *
 * L'intervalle est court, et il s'allonge exactement là où la connexion est
 * lente : une école au bout d'une 3G est le cas le plus exposé, pas le moins.
 *
 * Ces tests rendent les formulaires et interrogent le DOM produit. Ils ne
 * lisent pas le source : ce qui compte est ce que le navigateur recevrait.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ChangePasswordForm } from "@/components/forms/ChangePasswordForm"
import { LoginForm } from "@/components/forms/LoginForm"
import { StaffForm } from "@/components/forms/StaffForm"
import { WizardShell } from "@/components/super-admin/tenants-new/WizardShell"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: () => ({ data: null, status: "unauthenticated" }),
}))

/** Le wizard interroge le serveur pour vérifier le slug : il lui faut un client. */
function rendreAvecQuery(noeud: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{noeud}</QueryClientProvider>)
}

const FORMULAIRES = [
  { nom: "la page de connexion", rendre: () => render(<LoginForm />) },
  { nom: "le changement de mot de passe", rendre: () => render(<ChangePasswordForm />) },
  // Le mot de passe du premier administrateur d'une école : le champ est déclaré
  // dans StepAdmin, mais le formulaire qui l'entoure est ici.
  { nom: "la création d'un établissement", rendre: () => rendreAvecQuery(<WizardShell />), sansMotDePasseAuDepart: true },
  // Son champ bascule entre `text` et `password` selon l'œil affiché : une
  // recherche de `type="password"` littéral ne le voit pas. C'est comme ça
  // qu'il avait été oublié.
  { nom: "la création d'un membre du personnel", rendre: () => rendreAvecQuery(<StaffForm onSuccess={() => {}} />) },
]

describe.each(FORMULAIRES)("$nom", ({ rendre, sansMotDePasseAuDepart }) => {
  it("ne peut pas se soumettre en GET, même avant que React n'écoute", () => {
    const { container } = rendre()
    const form = container.querySelector("form")
    expect(form).not.toBeNull()
    // `method` vaut « get » par défaut : c'est ce défaut qui fuit.
    expect(form!.method).toBe("post")
  })

  it("porte bien un champ de mot de passe, sinon le test précédent ne garde rien", ({ skip }) => {
    // Le wizard n'affiche son étape « administrateur » qu'au second écran :
    // le champ n'est pas encore monté, mais le formulaire qui l'accueillera l'est.
    if (sansMotDePasseAuDepart) return skip()
    const { container } = rendre()
    expect(container.querySelector('input[type="password"]')).not.toBeNull()
  })
})
