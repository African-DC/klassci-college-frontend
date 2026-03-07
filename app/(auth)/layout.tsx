import { GraduationCap, BookOpen, Users, Shield } from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Gestion Academique",
    description: "Notes, bulletins, emplois du temps centralises",
  },
  {
    icon: Users,
    title: "Suivi Personnalise",
    description: "Portails dedies pour enseignants, eleves et parents",
  },
  {
    icon: Shield,
    title: "Securise & Fiable",
    description: "Donnees protegees, acces controle par role",
  },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-64 w-64 rounded-full bg-white/[0.03]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide">KLASSCI</h2>
              <p className="text-xs text-white/70 tracking-widest uppercase">College</p>
            </div>
          </div>

          {/* Center — tagline */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
                Votre plateforme
                <br />
                de gestion scolaire
              </h1>
              <p className="max-w-md text-lg text-white/80 leading-relaxed">
                Une solution moderne et complete pour piloter votre etablissement
                avec efficacite et transparence.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-5">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} KLASSCI College. Tous droits reserves.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-[45%]">
        {/* Mobile header */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">KLASSCI</h2>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">College</p>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          {children}
        </div>

        {/* Mobile footer */}
        <p className="mt-12 text-xs text-muted-foreground lg:hidden">
          &copy; {new Date().getFullYear()} KLASSCI College
        </p>
      </div>
    </div>
  )
}
