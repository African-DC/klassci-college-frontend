"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pause, Play, RefreshCw, ScrollText } from "lucide-react"
import { PageHero } from "@/components/shared/PageHero"
import { useLogs } from "@/lib/hooks/super-admin/useLogs"

const SERVICES = ["klassci-backend", "klassci-frontend", "klassci-celery", "nginx"]

export function LogsViewer() {
  const [service, setService] = useState("klassci-backend")
  const [lines, setLines] = useState(200)
  const [paused, setPaused] = useState(false)
  const { data, isLoading, isError, error, refetch, isFetching } = useLogs(service, lines, !paused)

  return (
    <div className="space-y-5">
      <PageHero
        icon={ScrollText}
        title="Journaux serveur"
        subtitle="Lecture des services Windows avec masquage automatique des secrets"
      />

      <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[minmax(0,14rem)_7rem_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Service</Label>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger className="h-11 sm:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="logs-lines">
            Lignes
          </Label>
          <Input
            id="logs-lines"
            type="number"
            min={10}
            max={5000}
            value={lines}
            onChange={(e) => setLines(Number(e.target.value))}
            className="h-11 sm:h-10"
          />
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? "Reprendre l'auto-rafraîchissement" : "Mettre en pause l'auto-rafraîchissement"}
            className="h-11 sm:h-10"
          >
            {paused ? <Play aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> : <Pause aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />}
            {paused ? "Reprendre" : "Pause"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Rafraîchir les logs manuellement"
            className="h-11 w-11 sm:h-10 sm:w-10"
          >
            <RefreshCw aria-hidden="true" className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {data && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{data.lines.length} lignes</span>
          {data.redacted_count > 0 && <Badge variant="secondary">{data.redacted_count} secret(s) masqué(s)</Badge>}
          {data.truncated && <Badge variant="outline">tronqué</Badge>}
        </div>
      )}

      <div className="rounded-lg border bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100">
        {isLoading ? (
          <p className="text-zinc-500">Chargement...</p>
        ) : isError ? (
          <p className="text-rose-400">{(error as Error).message}</p>
        ) : (data?.lines ?? []).length === 0 ? (
          <p className="text-zinc-500">(aucune ligne)</p>
        ) : (
          <div className="max-h-[600px] overflow-auto">
            {data!.lines.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">
                {line.raw}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
