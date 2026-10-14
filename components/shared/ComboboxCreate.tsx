"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ComboboxCreateProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  searchAliases?: Readonly<Record<string, string>>
  allowClear?: boolean
  disabled?: boolean
  customActionLabel?: string
  maxLength?: number
}

/** Combobox « sélectionner ou créer » (Popover shadcn + recherche + création inline). */
export function ComboboxCreate({
  options,
  value,
  onChange,
  placeholder = "Sélectionner…",
  searchPlaceholder = "Rechercher ou créer…",
  className,
  searchAliases,
  allowClear = false,
  disabled = false,
  customActionLabel = "Créer",
  maxLength,
}: ComboboxCreateProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const q = query.trim()
  const normalise = (s: string) => s.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase()
  const filtered = options.filter((o) => normalise(`${o} ${searchAliases?.[o] ?? ""}`).includes(normalise(q)))
  const exact = options.some((o) => normalise(o) === normalise(q))

  const select = (v: string) => {
    onChange(v)
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            maxLength={maxLength}
            className="h-9"
            autoFocus
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {allowClear && value && (
            <button type="button" onClick={() => select("")}
              className="w-full rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted">
              Effacer la sélection
            </button>
          )}
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => select(o)}
              className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
            >
              <span className="truncate">{o}</span>
              {value === o && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          ))}
          {q && !exact && (
            <button
              type="button"
              onClick={() => select(q)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {customActionLabel} «&nbsp;{q}&nbsp;»
            </button>
          )}
          {filtered.length === 0 && !q && (
            <p className="px-2 py-2 text-sm text-muted-foreground">Aucun type disponible</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
