"use client"

import { MoreVertical, Phone, MessageCircle, Mail, UserCheck, Unlink, MessageSquare } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { StatusPill, InitialsAvatar } from "../tabs/_primitives"
import { getRelationshipMeta, buildWhatsAppHref, type RelationshipTone } from "./relationship"

interface ParentCardProps {
  parent: {
    id: number
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    email?: string | null
    user_id?: number | null
    [key: string]: unknown
  }
  onUnlink: (parent: { id: number; name: string }) => void
}

const RELATION_TO_AVATAR: Record<RelationshipTone, "primary" | "accent" | "neutral"> = {
  primary: "primary",
  accent: "accent",
  warning: "neutral",
  neutral: "neutral",
}

export function ParentCard({ parent, onUnlink }: ParentCardProps) {
  const relType = (parent.relationship_type as string | undefined) ?? undefined
  const meta = getRelationshipMeta(relType)
  const fullName = `${parent.last_name ?? ""} ${parent.first_name ?? ""}`.trim() || "Parent"
  const phone = parent.phone ?? null
  const email = parent.email ?? null
  const whatsApp = buildWhatsAppHref(phone)
  const hasAccount = Boolean(parent.user_id)

  return (
    <article className="group flex flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3">
        <InitialsAvatar
          first={parent.first_name}
          last={parent.last_name}
          size="md"
          tone={RELATION_TO_AVATAR[meta.tone]}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-base leading-tight">{fullName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
            {hasAccount && (
              <StatusPill tone="success">
                <UserCheck className="h-3 w-3" />
                Compte
              </StatusPill>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-1 h-8 w-8 shrink-0 text-muted-foreground"
              aria-label="Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {email && (
              <DropdownMenuItem asChild>
                <a href={`mailto:${email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer un email
                </a>
              </DropdownMenuItem>
            )}
            {phone && (
              <DropdownMenuItem asChild>
                <a href={`sms:${phone}`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Envoyer un SMS
                </a>
              </DropdownMenuItem>
            )}
            {(email || phone) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onUnlink({ id: parent.id, name: fullName })}
            >
              <Unlink className="mr-2 h-4 w-4" />
              Délier de l&apos;élève
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Coordonnées compactes */}
      {(phone || email) && (
        <div className="space-y-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          {phone && (
            <p className="flex items-center gap-2 font-mono">
              <Phone className="h-3 w-3 shrink-0" />
              {phone}
            </p>
          )}
          {email && (
            <p className="flex items-center gap-2 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{email}</span>
            </p>
          )}
        </div>
      )}

      {/* Actions persona-first (h-11 touch targets) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {phone ? (
          <Button asChild variant="outline" size="sm" className="h-11 gap-1.5 sm:h-10">
            <a href={`tel:${phone}`}>
              <Phone className="h-3.5 w-3.5" />
              Appeler
            </a>
          </Button>
        ) : null}
        {whatsApp ? (
          <Button asChild variant="outline" size="sm" className="h-11 gap-1.5 sm:h-10">
            <a href={whatsApp} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </Button>
        ) : null}
        {email ? (
          <Button asChild variant="outline" size="sm" className="h-11 gap-1.5 sm:h-10">
            <a href={`mailto:${email}`}>
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  )
}
