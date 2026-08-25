import Image from "next/image"
import { BookOpen, Users, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Gestion académique",
    description: "Notes, bulletins et emplois du temps centralisés",
  },
  {
    icon: Users,
    title: "Portails dédiés",
    description: "Un espace pour chaque enseignant, parent et élève",
  },
  {
    icon: ShieldCheck,
    title: "Sécurisé et fiable",
    description: "Vos données protégées, accès contrôlé par rôle",
  },
]

const year = new Date().getFullYear()

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* ── Panneau gauche — récit de marque sur photo d'une classe ivoirienne ── */}
      <div className="relative hidden overflow-hidden bg-[#08264f] lg:flex lg:w-[56%]">
        {/* Photo de fond (enseignante + élèves). object-right garde le visage
            visible côté clair du voile. */}
        <Image
          src="/images/login-bg.png"
          alt=""
          fill
          priority
          sizes="56vw"
          className="object-cover object-right"
        />
        {/* Voile de marque : bleu profond à gauche (le texte) qui s'ouvre vers la
            droite pour laisser respirer la photo. */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07203f] via-[#0d3574]/[0.9] to-[#0f3f8c]/30" />
        {/* Assise verticale : renforce le logo (haut) et le pied (bas). */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07203f]/90 via-transparent to-[#07203f]/40" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white xl:p-16">
          {/* Logo */}
          <div className="flex w-fit flex-col items-center">
            <Image
              src="/images/logo_klassci.png"
              alt="KLASSCI"
              width={168}
              height={44}
              className="brightness-0 invert"
              priority
            />
            <span className="-mt-4 font-serif text-[16px] text-white/55">
              College
            </span>
          </div>

          {/* Récit central */}
          <div className="max-w-xl space-y-9 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/75 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F58220]" />
              Plateforme de gestion scolaire
            </span>

            <h1 className="border-l-2 border-[#F58220] pl-6 font-serif text-[2.6rem] font-bold leading-[1.1] text-white xl:text-[3.1rem]">
              Toute votre école,
              <br />
              <span className="text-[#F58220]">au même endroit.</span>
            </h1>

            <p className="max-w-md text-[15px] font-light leading-relaxed text-white/70">
              Notes, bulletins, présences et paiements réunis dans un seul espace
              pour piloter votre établissement au quotidien, en toute sérénité.
            </p>

            {/* Points forts, séparés par de fins filets */}
            <div className="divide-y divide-white/10 border-y border-white/10">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08]">
                    <feature.icon className="h-[18px] w-[18px] text-[#F58220]" />
                  </span>
                  <div className="pt-0.5">
                    <h3 className="text-[15px] font-medium tracking-wide text-white">
                      {feature.title}
                    </h3>
                    <p className="text-[13px] font-light text-white/50">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pied */}
          <div className="flex items-center justify-between text-[12px] font-light text-white/35">
            <span>&copy; {year} KLASSCI College</span>
            <span>Conçu pour les écoles de Côte d&apos;Ivoire</span>
          </div>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="relative flex w-full flex-col items-center justify-center bg-muted/30 px-6 py-12 lg:w-[44%]">
        {/* Logo mobile */}
        <div className="mb-8 flex w-fit flex-col items-center lg:hidden">
          <Image
            src="/images/logo_klassci.png"
            alt="KLASSCI"
            width={150}
            height={40}
            priority
          />
          <span className="-mt-3 font-serif text-[14px] text-muted-foreground">
            College
          </span>
        </div>

        {/* Carte formulaire élevée, filet orange focal en tête */}
        <div className="w-full max-w-[420px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-[0_24px_70px_-34px_rgba(4,83,203,0.4)] sm:p-8">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F58220] to-[#f9a826]" />
            {children}
          </div>

          {/* Pied mobile */}
          <p className="mt-8 text-center text-[11px] font-light text-muted-foreground/60 lg:hidden">
            &copy; {year} KLASSCI College &middot; Côte d&apos;Ivoire
          </p>
        </div>
      </div>
    </div>
  )
}
