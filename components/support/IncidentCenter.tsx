"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, ClipboardList, Search, LifeBuoy, Inbox, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { PageHero } from "@/components/shared/PageHero"
import { IncidentCreateDialog } from "@/components/support/IncidentCreateDialog"
import { IncidentDetail } from "@/components/support/IncidentDetail"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { supportIncidentApi } from "@/lib/api/support-incident"
import { tenantsApi } from "@/lib/api/super-admin/tenants"
import { STATUS_LABELS, type IncidentStatus } from "@/lib/contracts/support-incident"
import { formatIncidentDate } from "@/lib/support/format"

export function IncidentCenter({ scope }: { scope: "school" | "platform" }) {
  const platform = scope === "platform"
  const [tenant, setTenant] = useState("")
  const [reference, setReference] = useState("")
  const [status, setStatus] = useState<IncidentStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const validReference = !reference || /^[0-9A-Fa-f]{6,16}$/.test(reference)
  useEffect(() => {
    if (platform) return
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("reference")
    if (ref && /^[0-9a-f]{6,16}$/i.test(ref)) setReference(ref.toUpperCase())
  }, [platform])
  const { data: tenants, isError: tenantsError } = useQuery({
    queryKey: ["super-admin", "tenants"], queryFn: () => tenantsApi.list(), enabled: platform,
  })
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["support-incidents", scope, tenant, reference, status, page],
    queryFn: () => supportIncidentApi.list({ tenant: platform ? tenant : undefined, reference: reference || undefined, status, page }),
    enabled: (!platform || Boolean(tenant)) && validReference,
  })
  const choose = (id: string) => setSelected(id)
  useEffect(() => {
    if (selected && window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [selected])
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 20))
  return <div className="mx-auto max-w-7xl space-y-5 pb-8">
    <PageHero icon={LifeBuoy} title={platform ? "Centre des incidents" : "Assistance KLASSCI"}
      subtitle={platform ? "Rechercher les codes de référence et prendre en charge les incidents des établissements" : "Signalez un incident et suivez son traitement au même endroit"}
      actions={!platform ? <IncidentCreateDialog initialReference={reference} onCreated={(id) => { setReference(""); setStatus("all"); setPage(1); choose(id) }} /> : undefined}
      kpis={[{ label: "Dossiers trouvés", value: data?.total ?? "—", icon: ClipboardList },
        { label: "Page", value: page, icon: Inbox }]} />
    <Card className="border-border/80 shadow-sm"><CardContent className="grid gap-4 p-4 md:grid-cols-3 md:p-5">
      {platform && <div className="space-y-2 md:col-span-3"><Label>Établissement</Label>
        <Select value={tenant} onValueChange={(v) => { setTenant(v); setPage(1); setSelected(null) }}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Choisir un établissement pour rechercher ses incidents" /></SelectTrigger>
          <SelectContent>{tenants?.items.map((t) =>
            <SelectItem key={t.slug} value={t.slug}>{t.slug}</SelectItem>)}</SelectContent>
        </Select>
        {tenantsError && <p role="alert" className="text-sm text-destructive">Impossible de charger les établissements.</p>}
      </div>}
      <div className="space-y-2 md:col-span-2"><Label htmlFor="search-incident">Code de référence</Label>
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="search-incident" value={reference} maxLength={16} onChange={(e) => { setReference(e.target.value.toUpperCase()); setPage(1); setSelected(null) }}
            className="pl-10 font-mono uppercase" aria-invalid={!validReference} placeholder="Saisir le code affiché dans le message d'erreur" />
        </div>
        {!validReference && <p role="alert" className="text-xs text-destructive">Saisissez un code hexadécimal de 6 à 16 caractères.</p>}
      </div>
      <div className="space-y-2"><Label>Statut</Label>
        <Select value={status} onValueChange={(v) => { setStatus(v as IncidentStatus | "all"); setPage(1); setSelected(null) }}>
          <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {(Object.keys(STATUS_LABELS) as IncidentStatus[]).map((s) =>
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent></Select></div>
    </CardContent></Card>
    {!validReference ? <Card><CardContent className="p-8 text-sm text-muted-foreground">Complétez ou effacez le code de référence pour lancer la recherche.</CardContent></Card> : platform && !tenant ? <Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center">
      <Search className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Sélectionnez un établissement pour accéder à ses incidents.</p>
    </CardContent></Card> :
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
      <div className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Signalements</h2>
          <Button size="sm" variant="ghost" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
        </div>
        {isPending ? <Card><CardContent className="p-8 text-sm text-muted-foreground">Chargement des incidents…</CardContent></Card> :
        isError ? <Card><CardContent className="flex items-center gap-2 p-6 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />Impossible de charger les incidents.</CardContent></Card> :
        data?.items.length === 0 ? <Card><CardContent className="flex flex-col items-center gap-2 p-10 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/60" />
          <p className="font-medium">Aucun incident trouvé</p>
          <p className="text-sm text-muted-foreground">Modifiez les filtres ou créez un nouveau signalement.</p>
        </CardContent></Card> :
        <div className="space-y-2">{data?.items.map((item) => <button key={item.id}
          onClick={() => choose(item.id)} aria-pressed={selected === item.id}
          className={"w-full min-w-0 rounded-xl border p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
            (selected === item.id ? "border-primary bg-primary/5" : "border-border bg-card")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline">{STATUS_LABELS[item.status]}</Badge>
            <span className="text-xs text-muted-foreground">{formatIncidentDate(item.created_at)}</span>
          </div>
          <p className="mt-2 break-words text-sm font-semibold">{item.title}</p>
          <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">{item.description}</p>
          {item.reference && <span className="mt-2 inline-block font-mono text-xs text-muted-foreground">Réf. {item.reference}</span>}
        </button>)}</div>}
        {data && data.total > 20 && <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => { setPage((v) => v - 1); setSelected(null) }}>
            <ChevronLeft className="mr-1 h-4 w-4" />Précédent</Button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage((v) => v + 1); setSelected(null) }}>
            Suivant<ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>}
      </div>
      <div ref={detailRef} className="min-w-0 scroll-mt-20">
        {selected ? <IncidentDetail key={selected + tenant} incidentId={selected} tenant={platform ? tenant : undefined} /> :
          <Card className="hidden min-h-64 place-items-center border-dashed lg:grid"><CardContent className="space-y-2 text-center">
            <ClipboardList className="mx-auto h-9 w-9 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Sélectionnez un dossier pour consulter son historique.</p>
          </CardContent></Card>}
      </div>
    </div>}
  </div>
}
