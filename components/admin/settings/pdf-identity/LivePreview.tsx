"use client"

interface LivePreviewProps {
  schoolName: string
  ministryCode: string | null
  motto: string
  website: string
  primary: string
  accent: string
  logoUrl: string | null
}

export function LivePreview({
  schoolName,
  ministryCode,
  motto,
  website,
  primary,
  accent,
  logoUrl,
}: LivePreviewProps) {
  const logoSrc = logoUrl?.startsWith("/uploads/")
    ? `${process.env.NEXT_PUBLIC_API_URL}${logoUrl}`
    : logoUrl

  return (
    <aside
      aria-label="Aperçu du theme PDF"
      className="rounded-2xl border border-border bg-gradient-to-br from-muted/30 via-background to-muted/20 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Aperçu en direct
        </span>
        <span
          className="inline-flex h-5 items-center gap-1.5 rounded-full bg-foreground/5 px-2 text-[10px] text-muted-foreground"
          aria-hidden
        >
          <span className="h-2 w-2 rounded-full" style={{ background: primary }} />
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
        </span>
      </div>

      <div className="rounded-lg bg-white shadow-[0_4px_20px_-4px_rgba(15,63,140,0.15)] ring-1 ring-black/5 overflow-hidden">
        {/* Banner RCI */}
        <div className="px-4 pt-3 pb-2 text-center">
          <p className="text-[7px] uppercase tracking-[0.15em] text-slate-700">
            République de Côte d&apos;Ivoire
          </p>
          <p className="text-[6.5px] italic text-slate-500">
            Union — Discipline — Travail
          </p>
        </div>

        {/* Header école */}
        <div className="mx-4 flex items-center gap-2.5 border-b border-slate-200 pb-2.5">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="h-9 w-9 object-contain shrink-0" />
          ) : (
            <div
              className="h-9 w-9 rounded-md shrink-0"
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
            />
          )}
          <div className="flex-1 text-center">
            <p
              className="text-[10px] font-bold tracking-tight leading-tight"
              style={{ color: primary }}
            >
              {schoolName || "Mon Établissement"}
            </p>
            {ministryCode && (
              <p className="text-[7px] text-slate-500 mt-0.5">
                Code MENA : <strong>{ministryCode}</strong>
              </p>
            )}
            {motto && (
              <p className="text-[7px] italic mt-0.5" style={{ color: accent }}>
                « {motto} »
              </p>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center px-4 pt-3 pb-1">
          <p
            className="text-[12px] font-bold tracking-[0.05em]"
            style={{ color: primary }}
          >
            REÇU DE VERSEMENT
          </p>
        </div>

        {/* Amount box */}
        <div className="mx-4 my-2">
          <div
            className="rounded-md border-2 px-3 py-2 text-center"
            style={{
              borderColor: primary,
              background: `linear-gradient(135deg, ${primary}08 0%, ${primary}14 100%)`,
            }}
          >
            <p className="text-[8px] uppercase tracking-wider text-slate-500">
              Montant versé
            </p>
            <p className="text-base font-bold tabular-nums" style={{ color: primary }}>
              50 000 XOF
            </p>
          </div>
        </div>

        {/* Section title */}
        <div
          className="mx-4 mt-2 pb-0.5 text-[8px] font-bold uppercase tracking-wider"
          style={{ color: primary, borderBottom: `1.5px solid ${primary}` }}
        >
          Détail de l&apos;allocation
        </div>

        {/* Mini table */}
        <table className="mx-4 mt-1.5 w-[calc(100%-2rem)] text-[7.5px]">
          <thead>
            <tr>
              <th
                className="py-1 px-1.5 text-left uppercase tracking-wider text-white"
                style={{ background: primary, fontSize: "6.5px" }}
              >
                Frais
              </th>
              <th
                className="py-1 px-1.5 text-right uppercase tracking-wider text-white"
                style={{ background: primary, fontSize: "6.5px" }}
              >
                Affecté
              </th>
              <th
                className="py-1 px-1.5 text-left uppercase tracking-wider text-white"
                style={{ background: primary, fontSize: "6.5px" }}
              >
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 px-1.5 border-b border-slate-100">Scolarité T1</td>
              <td className="py-1 px-1.5 text-right tabular-nums border-b border-slate-100">
                +20 000
              </td>
              <td className="py-1 px-1.5 border-b border-slate-100">
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[6px] font-bold uppercase text-emerald-800">
                  Payé
                </span>
              </td>
            </tr>
            <tr className="bg-slate-50">
              <td className="py-1 px-1.5 border-b border-slate-100">Scolarité T2</td>
              <td className="py-1 px-1.5 text-right tabular-nums border-b border-slate-100">
                +10 000
              </td>
              <td className="py-1 px-1.5 border-b border-slate-100">
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[6px] font-bold uppercase text-emerald-800">
                  Payé
                </span>
              </td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 border-b border-slate-100">Scolarité T3</td>
              <td className="py-1 px-1.5 text-right tabular-nums border-b border-slate-100">
                +20 000
              </td>
              <td className="py-1 px-1.5 border-b border-slate-100">
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[6px] font-bold uppercase text-amber-800">
                  Partiel
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="mx-4 mt-3 mb-3 pt-1.5 border-t border-slate-200 flex justify-between text-[6.5px] text-slate-500">
          <span className="font-bold">{schoolName || "Mon Établissement"}</span>
          {website && (
            <span style={{ color: accent }} className="font-medium">
              {website.replace(/^https?:\/\//, "")}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground leading-snug text-center italic">
        L&apos;aperçu reflète immédiatement les couleurs et la devise. Cliquez sur{" "}
        <strong>Aperçu PDF</strong> pour télécharger un document réel.
      </p>
    </aside>
  )
}
