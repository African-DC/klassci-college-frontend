"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Pause, Play, RefreshCw } from "lucide-react"
import { useLogs } from "@/lib/hooks/super-admin/useLogs"

const SERVICES = ["klassci-backend", "klassci-frontend", "klassci-celery", "nginx"]

export function LogsViewer() {
  const [service, setService] = useState("klassci-backend")
  const [lines, setLines] = useState(200)
  const [paused, setPaused] = useState(false)
  const { data, isLoading, isError, error, refetch, isFetching } = useLogs(service, lines, !paused)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
        <p className="text-sm text-muted-foreground">
          Lecture du journal système. Tokens, mots de passe et emails sont automatiquement masqués.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border bg-card p-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Service</Label>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger className="w-56">
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
            className="w-24"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play className="mr-1.5 h-3.5 w-3.5" /> : <Pause className="mr-1.5 h-3.5 w-3.5" />}
            {paused ? "Reprendre" : "Pause"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {data && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{data.lines.length} lignes</span>
          {data.redacted_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {data.redacted_count} secret(s) masqué(s)
            </Badge>
          )}
          {data.truncated && (
            <Badge variant="outline" className="text-xs">
              tronqué
            </Badge>
          )}
        </div>
      )}

      <div className="rounded-md border bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100">
        {isLoading ? (
          <p className="text-zinc-500">Chargement…</p>
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
