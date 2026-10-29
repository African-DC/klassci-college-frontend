"use client"

import { useId, useState, type KeyboardEvent } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  MultiComboboxChip,
  MultiComboboxError,
  MultiComboboxLoading,
} from "./multi-combobox-parts"
import { searchScore, type MultiComboboxOption } from "./multi-combobox-utils"

export interface MultiComboboxProps<T extends number | string = number | string> {
  options: MultiComboboxOption<T>[]
  value: T[]
  onChange: (value: T[]) => void
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  loadingText?: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onSearchChange?: (query: string) => void
  disabled?: boolean
  /** Vrai par défaut : le combobox vit dans un Dialog, la liste reste modale. */
  modal?: boolean
  id?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
}

const filterOption = (_value: string, search: string, keywords?: string[]) =>
  searchScore(keywords?.join(" ") ?? "", search)

const summary = (count: number, placeholder: string) => {
  if (count === 0) return placeholder
  return `${count} enseignant${count > 1 ? "s" : ""} sélectionné${count > 1 ? "s" : ""}`
}

export function MultiCombobox<T extends number | string = number | string>({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  loadingText = "Chargement…",
  loading = false,
  error = null,
  onRetry,
  onSearchChange,
  disabled = false,
  modal = true,
  id,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: MultiComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const selected = value.map((v) => {
    const option = options.find((item) => item.value === v)
    const label = option?.label ?? (loading ? "…" : "Enseignant introuvable")
    return { value: v, label }
  })

  function toggle(option: MultiComboboxOption<T>) {
    const isSelected = value.includes(option.value)
    onChange(isSelected ? value.filter((v) => v !== option.value) : [...value, option.value])
  }

  function remove(optionValue: T) {
    if (disabled) return
    onChange(value.filter((v) => v !== optionValue))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
    }
  }

  const renderList = () => {
    if (loading) return <MultiComboboxLoading text={loadingText} />
    if (error) return <MultiComboboxError message={error} onRetry={onRetry} />
    if (options.length === 0) {
      return <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
    }
    return (
      <>
        <CommandEmpty className="px-3 py-6 text-center text-sm text-muted-foreground">
          Aucun résultat pour cette recherche.
        </CommandEmpty>
        {options.map((option) => {
          const isSelected = value.includes(option.value)
          return (
            <CommandItem
              key={String(option.value)}
              value={String(option.value)}
              keywords={[option.label, option.hint ?? "", option.searchText ?? ""]}
              onSelect={() => toggle(option)}
              className="min-h-11 gap-2"
            >
              <Check className={cn("h-4 w-4 shrink-0 text-primary", isSelected ? "opacity-100" : "opacity-0")} aria-hidden />
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{option.label}</span>
                {option.hint && <span className="truncate text-xs text-muted-foreground">{option.hint}</span>}
              </span>
            </CommandItem>
          )
        })}
      </>
    )
  }

  return (
    <div className="w-full space-y-2">
      <Popover open={open} onOpenChange={(next) => setOpen(disabled ? false : next)} modal={modal}>
        <PopoverTrigger asChild>
          <div
            id={id}
            role="combobox"
            tabIndex={disabled ? -1 : 0}
            aria-expanded={open}
            aria-controls={listId}
            aria-haspopup="listbox"
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-disabled={disabled || undefined}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <span className={cn("min-w-0 truncate", value.length === 0 && "text-muted-foreground")}>
              {summary(value.length, placeholder)}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
          </div>
        </PopoverTrigger>
        <PopoverContent id={listId} className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command filter={filterOption}>
            <CommandInput placeholder={searchPlaceholder} onValueChange={onSearchChange} />
            <CommandList className="max-h-[min(50dvh,320px)] overflow-y-auto overscroll-contain">
              {renderList()}
            </CommandList>
          </Command>
          {value.length > 0 && (
            <div className="border-t p-1">
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full justify-center text-muted-foreground"
                onClick={() => onChange([])}
              >
                Tout retirer ({value.length})
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <MultiComboboxChip
              key={String(item.value)}
              label={item.label}
              disabled={disabled}
              onRemove={() => remove(item.value)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
