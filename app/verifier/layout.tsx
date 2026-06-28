import type { Metadata } from "next"
import Image from "next/image"

// Page de vérification publique : ne doit jamais être indexée par les moteurs
// de recherche (lien transactionnel rattaché à un document nominatif).
export const metadata: Metadata = {
  title: "Vérification de document — KLASSCI",
  description: "Vérifiez l'authenticité d'un document scolaire émis via KLASSCI.",
  robots: { index: false, follow: false },
}

export default function VerifierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Pied de page minimal — identité KLASSCI discrète, pas de nav privée. */}
      <footer className="border-t bg-background/60 py-5">
        <div className="mx-auto flex max-w-md flex-col items-center gap-1 px-4 text-center">
          <Image
            src="/images/logo_klassci.png"
            alt="KLASSCI"
            width={104}
            height={28}
            className="opacity-80"
          />
          <p className="text-[11px] font-light text-muted-foreground/70">
            Service de vérification de documents scolaires
          </p>
        </div>
      </footer>
    </div>
  )
}
