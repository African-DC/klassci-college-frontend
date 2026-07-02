"use client"

import * as React from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportToExcel } from "@/lib/export/excel"
import { exportToPdf } from "@/lib/export/pdf"
import type { ExportPayload } from "@/lib/export/types"

type ExportKind = "excel" | "pdf"

interface ExportMenuProps {
  /** Nom de base du fichier téléchargé (sans extension). */
  filename: string
  /**
   * Fournit la charge utile au moment du clic (lazy) afin de capturer
   * les lignes filtrées courantes de la page appelante.
   */
  getPayload: () => ExportPayload | Promise<ExportPayload>
  /** Désactive le menu (ex : aucune donnée à exporter). */
  disabled?: boolean
}

/**
 * Menu déroulant « Exporter » proposant un export Excel (.xlsx) et PDF,
 * thémés par les couleurs du tenant. La génération est lazy : les données
 * sont lues via `getPayload` au moment du clic.
 */
export function ExportMenu({ filename, getPayload, disabled }: ExportMenuProps) {
  const [loading, setLoading] = React.useState<ExportKind | null>(null)

  const handleExport = React.useCallback(
    async (kind: ExportKind) => {
      setLoading(kind)
      try {
        const payload = await getPayload()
        if (kind === "excel") {
          await exportToExcel(payload, filename)
        } else {
          await exportToPdf(payload, filename)
        }
        toast.success(
          kind === "excel" ? "Export Excel généré" : "Export PDF généré",
        )
      } catch (error) {
        console.error("Export error:", error)
        toast.error("Impossible de générer l'export. Veuillez réessayer.")
      } finally {
        setLoading(null)
      }
    },
    [filename, getPayload],
  )

  const isBusy = loading !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-11 md:h-9"
          disabled={disabled || isBusy}
        >
          {isBusy ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Download aria-hidden="true" />
          )}
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="h-11 md:h-9 cursor-pointer"
          disabled={isBusy}
          onSelect={(event) => {
            event.preventDefault()
            void handleExport("excel")
          }}
        >
          <FileSpreadsheet aria-hidden="true" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="h-11 md:h-9 cursor-pointer"
          disabled={isBusy}
          onSelect={(event) => {
            event.preventDefault()
            void handleExport("pdf")
          }}
        >
          <FileText aria-hidden="true" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
