import type { Metadata } from "next"
import Image from "next/image"

/**
 * La page qui s'ouvre sur le téléphone, après un code QR affiché sur un écran.
 *
 * Trois contraintes de terrain la dessinent, et aucune n'est esthétique :
 *
 * - **Elle se lit dehors, à midi.** Les couleurs restent des jetons de thème,
 *   comme partout dans le portail, mais rien de ce qui porte une information
 *   n'est en `muted-foreground` : un gris pâle sur un TFT d'entrée de gamme en
 *   plein soleil ne se lit pas. Le secondaire s'y met, le nécessaire non.
 * - **Elle tient dans un écran d'entrée de gamme**, sans barre de navigation ni
 *   chrome de portail : la hauteur sert aux boutons, qui doivent être atteints
 *   au pouce, d'une main, l'autre tenant le téléphone.
 * - **Elle ne s'indexe pas.** L'URL porte un jeton ; un moteur qui la garderait
 *   la servirait au suivant. `noindex, nofollow` ici, `no-store` côté serveur.
 */
export const metadata: Metadata = {
  title: "Envoyer une photo — KLASSCI",
  description: "Envoyez une photo depuis votre téléphone vers l'ordinateur qui l'a demandée.",
  robots: { index: false, follow: false },
}

export default function TeleverserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main className="flex flex-1 flex-col px-4 py-5 sm:mx-auto sm:w-full sm:max-w-md sm:py-8">
        {children}
      </main>

      <footer className="border-t py-4">
        <div className="mx-auto flex max-w-md flex-col items-center gap-1 px-4 text-center">
          <Image
            src="/images/logo_klassci.png"
            alt="KLASSCI"
            width={92}
            height={25}
            className="opacity-70"
          />
          <p className="text-[11px] text-muted-foreground">Envoi de photo depuis un téléphone</p>
        </div>
      </footer>
    </div>
  )
}
