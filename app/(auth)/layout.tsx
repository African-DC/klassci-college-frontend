import Image from "next/image"
import { BookOpen, Users, Shield } from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Gestion académique",
    description: "Notes, bulletins, emplois du temps centralisés",
  },
  {
    icon: Users,
    title: "Suivi personnalisé",
    description: "Portails dédiés pour enseignants, élèves et parents",
  },
  {
    icon: Shield,
    title: "Sécurisé & fiable",
    description: "Données protégées, accès contrôlé par rôle",
  },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding sur photo d'une classe ivoirienne */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#08264f]">
        {/* Photo de fond (enseignante + élèves) — object-right pour garder le
            visage visible côté clair du voile. */}
        <Image
          src="/images/login-bg.png"
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover object-right"
        />
        {/* Voile de marque : bleu foncé à gauche (là où est le texte) →
            translucide à droite (la photo respire), pour la lisibilité. */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08264f]/[0.97] via-[#0f3f8c]/[0.86] to-[#0f3f8c]/[0.32]" />
        {/* Vignette verticale : renforce logo (haut) et pied (bas). */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08264f]/85 via-transparent to-[#08264f]/45" />
        {/* Halo orange de marque, discret, en bas à droite. */}
        <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-[#f58220]/25 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white">
          {/* Logo + College */}
          <div className="flex flex-col items-center w-fit">
            <Image
              src="/images/logo_klassci.png"
              alt="KLASSCI"
              width={180}
              height={48}
              className="brightness-0 invert"
              priority
            />
            <span className="font-serif text-[17px] -mt-4 text-white/60">
              College
            </span>
          </div>

          {/* Center — tagline */}
          <div className="space-y-10">
            <div className="space-y-5">
              <h1 className="font-serif text-4xl leading-tight xl:text-[3.2rem] xl:leading-[1.15] text-white">
                Votre plateforme
                <br />
                <span className="text-[#F58220]">de gestion scolaire</span>
              </h1>
              <p className="max-w-lg text-[15px] leading-relaxed text-white/65 font-light">
                Une solution moderne et complète pour piloter votre établissement
                avec efficacité et transparence.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px w-16 bg-white/20" />

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] border border-white/[0.06]">
                    <feature.icon className="h-[18px] w-[18px] text-white/80" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium tracking-wide">{feature.title}</h3>
                    <p className="text-[13px] text-white/50 font-light">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[13px] text-white/30 font-light">
            &copy; {new Date().getFullYear()} KLASSCI College. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-[45%]">
        {/* Mobile logo */}
        <div className="mb-10 flex flex-col items-center w-fit lg:hidden">
          <Image
            src="/images/logo_klassci.png"
            alt="KLASSCI"
            width={150}
            height={40}
            priority
          />
          <span className="font-serif text-[14px] -mt-3 text-muted-foreground">
            College
          </span>
        </div>

        <div className="w-full max-w-[400px]">
          {children}
        </div>

        {/* Mobile footer */}
        <p className="mt-12 text-[11px] text-muted-foreground/60 font-light lg:hidden">
          &copy; {new Date().getFullYear()} KLASSCI College
        </p>
      </div>
    </div>
  )
}
