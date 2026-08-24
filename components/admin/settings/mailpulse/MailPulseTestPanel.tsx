"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTestMailPulse } from "@/lib/hooks/useMailPulse"
import {
  MAILPULSE_CHANNELS,
  MAILPULSE_EVENTS,
  type MailPulseEvent,
  type MailPulseTestChannel,
  type MailPulseTestResponse,
} from "@/lib/contracts/mailpulse"

/** Panneau d'envoi de test — vers les destinataires de test uniquement. */
export function MailPulseTestPanel() {
  const [event, setEvent] = useState<MailPulseEvent>("payment_received")
  const [channel, setChannel] = useState<MailPulseTestChannel>("both")
  const [dryRun, setDryRun] = useState(true)
  const [result, setResult] = useState<MailPulseTestResponse | null>(null)
  const { mutate, isPending } = useTestMailPulse()

  const run = () => {
    mutate({ event, channel, dry_run: dryRun }, { onSuccess: setResult })
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#f5821f] to-[#f9a826] text-white shadow-sm">
          <Send className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Envoyer un test</h3>
          <p className="text-xs text-muted-foreground">
            Uniquement vers vos destinataires de test, jamais un vrai parent.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Évènement</Label>
          <Select value={event} onValueChange={(v) => setEvent(v as MailPulseEvent)}>
            <SelectTrigger className="h-11 sm:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAILPULSE_EVENTS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Canal</Label>
          <Select value={channel} onValueChange={(v) => setChannel(v as MailPulseTestChannel)}>
            <SelectTrigger className="h-11 sm:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAILPULSE_CHANNELS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 text-sm">
          <Switch checked={dryRun} onCheckedChange={setDryRun} />
          <span>
            Mode simulation
            <span className="block text-xs text-muted-foreground">
              {dryRun ? "Aucun message réel envoyé" : "Envoi réel via MailPulse"}
            </span>
          </span>
        </label>
        <Button type="button" onClick={run} disabled={isPending} className="h-11 sm:h-10">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi…
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Lancer le test
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-2 rounded-md border bg-background p-3">
          <p className="text-sm font-medium">{result.message}</p>
          {result.results.length > 0 && (
            <ul className="space-y-1.5">
              {result.results.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  {r.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <span className="font-medium capitalize">{r.channel}</span>
                  <span className="text-muted-foreground">{r.recipient}</span>
                  <span className="ml-auto text-muted-foreground">
                    {r.error_message ?? r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
