"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ColorFieldProps {
  label: string
  hint: string
  value: string
  isValid: boolean
  onChange: (v: string) => void
}

export function ColorField({ label, hint, value, isValid, onChange }: ColorFieldProps) {
  return (
    <div
      className="group rounded-xl border border-border bg-background p-3 transition-colors hover:border-foreground/20"
      style={{ "--swatch": value } as React.CSSProperties}
    >
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="mt-2 flex items-center gap-2">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
          <input
            type="color"
            value={isValid ? value : "#000000"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            aria-label={`Sélecteur ${label}`}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
            style={{ background: "var(--swatch)" }}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="#0F3F8C"
          maxLength={7}
          className="h-11 font-mono text-sm tracking-wider uppercase"
          aria-invalid={!isValid}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">{hint}</p>
    </div>
  )
}
