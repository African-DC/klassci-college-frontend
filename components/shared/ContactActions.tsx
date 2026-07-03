import { Phone, MessageCircle, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Actions de contact « Wave-style » (persona Mme Diallo) : Appeler / WhatsApp /
 * Email, gros boutons tactiles (h-11), réutilisables sur une fiche détail.
 * `variant="hero"` = boutons verre sur le dégradé foncé du hero ;
 * `variant="card"` = boutons outline sur fond clair.
 */
interface ContactActionsProps {
  phone?: string | null
  email?: string | null
  variant?: "hero" | "card"
  className?: string
}

const heroBtn =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/25 sm:h-10"
const cardBtn =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted sm:h-10"

export function ContactActions({ phone, email, variant = "card", className }: ContactActionsProps) {
  const btn = variant === "hero" ? heroBtn : cardBtn
  const waNumber = phone ? phone.replace(/[^\d]/g, "") : ""

  if (!phone && !email) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {phone && (
        <a href={`tel:${phone}`} className={btn} aria-label={`Appeler ${phone}`}>
          <Phone className="h-4 w-4" aria-hidden="true" />
          Appeler
        </a>
      )}
      {waNumber && (
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          aria-label="Contacter par WhatsApp"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className={btn} aria-label={`Envoyer un email à ${email}`}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          Email
        </a>
      )}
    </div>
  )
}
