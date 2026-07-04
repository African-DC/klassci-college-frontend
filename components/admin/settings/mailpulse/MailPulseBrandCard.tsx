"use client"

import { KeyRound, Lock } from "lucide-react"

/**
 * Bloc d'identité MailPulse fidèle à la marque : fond sombre, monogramme
 * enveloppe orange, wordmark « Mail » clair + « Pulse » orange, tagline et
 * badge d'état de la clé API. Repris de l'intégration KLASSCIv2.
 */
export function MailPulseBrandCard({ apiKeySet }: { apiKeySet: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#18181b] bg-[#09090b] p-4 text-[#fafafa] sm:p-5">
      {/* Monogramme enveloppe */}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#27272a] bg-[#09090b]">
        <div
          className="pointer-events-none absolute inset-2 rounded-full blur-[12px]"
          style={{ background: "rgba(249,115,22,0.22)" }}
        />
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="relative z-10 h-7 w-7">
          <path
            d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 6l8 5 8-5"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Wordmark + tagline */}
      <div className="min-w-0 flex-1">
        <p className="text-xl font-extrabold leading-none tracking-tight">
          Mail<span className="text-[#f97316]">Pulse</span>
        </p>
        <p className="mt-1.5 text-[13px] text-[#a1a1aa]">
          Email, WhatsApp et automatisations transactionnelles
        </p>
      </div>

      {/* Badge état clé API */}
      {apiKeySet ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
          <Lock className="h-3.5 w-3.5" />
          Clé API configurée
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-bold text-orange-800">
          <KeyRound className="h-3.5 w-3.5" />
          Clé API à configurer
        </span>
      )}
    </div>
  )
}
