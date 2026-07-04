import { ImageResponse } from "next/og"

// Carte sociale KLASSCI College (Open Graph / Twitter). Rendue au build (aucun
// paramètre dynamique) : le WASM de next/og tourne côté build, pas à la requête.
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_ALT =
  "KLASSCI College — Gestion scolaire pour les collèges et lycées"
export const OG_CONTENT_TYPE = "image/png"

// Couleurs de marque (globals.css) : bleu #0F3F8C, orange #F58220.
export function renderSocialCard(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 76,
          color: "#ffffff",
          fontFamily: "sans-serif",
          background:
            "linear-gradient(135deg, #0a3d8f 0%, #0453cb 46%, #2a69cb 60%, #f5821f 100%)",
        }}
      >
        {/* Pastille contexte */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: 999,
              fontSize: 26,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.92)",
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.28)",
            }}
          >
            Côte d&apos;Ivoire · Collèges &amp; Lycées
          </div>
        </div>

        {/* Wordmark + accroche */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 128, fontWeight: 800, color: "#F58220" }}>K</span>
            <span style={{ fontSize: 128, fontWeight: 800, letterSpacing: -2 }}>
              LASSCI
            </span>
            <span
              style={{
                fontSize: 64,
                fontWeight: 500,
                marginLeft: 24,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              College
            </span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 44,
              fontWeight: 500,
              color: "rgba(255,255,255,0.94)",
            }}
          >
            La gestion scolaire simple pour les collèges et lycées.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontSize: 30,
              color: "rgba(255,255,255,0.78)",
            }}
          >
            Inscriptions · Notes &amp; bulletins · Paiements · Présences
          </div>
        </div>

        {/* Pied : accent + domaine */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 64,
              height: 8,
              borderRadius: 999,
              background: "#F58220",
              marginRight: 22,
            }}
          />
          <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.9)" }}>
            college.klassci.com
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
