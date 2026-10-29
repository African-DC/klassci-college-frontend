"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ClipboardCopy, Check, Send, RefreshCw, LoaderCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supportIncidentApi } from "@/lib/api/support-incident"
import {
  STATUS_LABELS, PRIORITY_LABELS,
  type IncidentStatus, type IncidentPriority,
} from "@/lib/contracts/support-incident"
import { formatIncidentDate } from "@/lib/support/format"

export function IncidentDetail({ incidentId, tenant }: { incidentId: string; tenant?: string }) {
  const client = useQueryClient()
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const detailKey = ["support-incident", tenant ?? "school", incidentId]
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: detailKey, queryFn: () => supportIncidentApi.get(incidentId, tenant),
  })
  const refresh = () => { void client.invalidateQueries({ queryKey: ["support-incidents"] }); void client.invalidateQueries({ queryKey: detailKey }) }
  const reply = useMutation({
    mutationFn: () => supportIncidentApi.reply(incidentId, message, tenant),
    onSuccess: () => { setMessage(""); refresh(); toast.success("Réponse envoyée") },
    onError: () => toast.error("Impossible d'envoyer la réponse"),
  })
  const update = useMutation({
    mutationFn: (payload: { status: IncidentStatus; priority?: IncidentPriority }) =>
      supportIncidentApi.update(incidentId, tenant!, payload),
    onSuccess: () => { refresh(); toast.success("Incident mis à jour") },
    onError: () => toast.error("Modification impossible"),
  })
  if (isLoading) return <Card><CardContent className="p-8 text-sm text-muted-foreground">Chargement du dossier…</CardContent></Card>
  if (isError || !data) return <Card><CardContent className="space-y-3 p-6"><p role="alert">Impossible d'ouvrir cet incident.</p><Button variant="outline" onClick={() => void refetch()}>Réessayer</Button></CardContent></Card>
  return (
    <Card className="min-w-0 overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="space-y-3 border-b bg-muted/30 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="secondary">{STATUS_LABELS[data.status]}</Badge>
          <span className="text-xs text-muted-foreground">{formatIncidentDate(data.created_at)}</span>
        </div>
        <CardTitle className="break-words text-lg sm:text-xl">{data.title}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {data.reference && <Button variant="outline" size="sm" className="max-w-full font-mono" onClick={async () => {
            await navigator.clipboard.writeText(data.reference!)
            setCopied(true); toast.success("Référence copiée")
          }}>{copied ? <Check className="mr-1 h-4 w-4" /> : <ClipboardCopy className="mr-1 h-4 w-4" />}{data.reference}</Button>}
          <span className="text-xs text-muted-foreground">Dossier {data.id.slice(0, 10)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        <section className="space-y-2"><h3 className="text-sm font-semibold">Description</h3><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{data.description}</p></section>
        {tenant && <section className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2"><Label>Statut</Label><Select value={data.status} disabled={update.isPending}
            onValueChange={(status) => update.mutate({ status: status as IncidentStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {(Object.keys(STATUS_LABELS) as IncidentStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select></div>
          <div className="space-y-2"><Label>Priorité</Label><Select value={data.priority} disabled={update.isPending}
            onValueChange={(priority) => update.mutate({ status: data.status, priority: priority as IncidentPriority })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {(Object.keys(PRIORITY_LABELS) as IncidentPriority[]).map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}
            </SelectContent>
          </Select></div>
        </section>}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Historique et échanges</h3>
          {data.events.length === 0 && <p className="text-sm text-muted-foreground">Aucun échange pour le moment.</p>}
          <ol className="space-y-3">
            {data.events.map((event) => <li key={event.id} className="rounded-xl border bg-muted/20 p-3 text-sm">
              <div className="mb-1 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>{event.actor_kind === "support" ? "Équipe technique KLASSCI" : event.actor_kind === "school" ? "Établissement" : "Système"}</span>
                <time>{formatIncidentDate(event.created_at)}</time>
              </div>
              {event.status && <p className="font-medium">{STATUS_LABELS[event.status as IncidentStatus] ?? event.status}</p>}
              {event.message && <p className="whitespace-pre-wrap break-words">{event.message}</p>}
            </li>)}
          </ol>
        </section>
        {data.status !== "closed" && <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); reply.mutate() }}>
          <Label htmlFor="support-reply">Ajouter une réponse</Label>
          <Textarea id="support-reply" rows={3} minLength={2} maxLength={2000} required value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez l'action réalisée ou les informations complémentaires…" />
          <Button disabled={reply.isPending || message.trim().length < 2} type="submit">
            {reply.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Envoyer
          </Button>
        </form>}
        <Button variant="ghost" size="sm" onClick={() => void refetch()}><RefreshCw className="mr-2 h-4 w-4" />Actualiser le dossier</Button>
      </CardContent>
    </Card>
  )
}
