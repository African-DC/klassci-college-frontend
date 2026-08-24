import {
  OG_ALT,
  OG_CONTENT_TYPE,
  OG_SIZE,
  renderSocialCard,
} from "@/lib/og/social-card"

export const alt = OG_ALT
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function TwitterImage() {
  return renderSocialCard()
}
