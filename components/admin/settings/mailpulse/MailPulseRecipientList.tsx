"use client"

import { useFieldArray, type Control } from "react-hook-form"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { FormField } from "@/components/ui/form"
import type { MailPulseConfigForm } from "@/lib/contracts/mailpulse"

interface MailPulseRecipientListProps {
  control: Control<MailPulseConfigForm>
  name: "test_email_recipients" | "test_phone_recipients"
  placeholder: string
  inputType?: "email" | "tel" | "text"
  addLabel: string
}

/** Liste de destinataires de test avec interrupteur actif/inactif par entrée. */
export function MailPulseRecipientList({
  control,
  name,
  placeholder,
  inputType = "text",
  addLabel,
}: MailPulseRecipientListProps) {
  const { fields, append, remove } = useFieldArray({ control, name })

  return (
    <div className="space-y-2">
      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          Aucun destinataire. Ajoutez-en un pour tester les envois.
        </p>
      ) : (
        fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2"
          >
            <FormField
              control={control}
              name={`${name}.${index}.value`}
              render={({ field: f }) => (
                <Input
                  {...f}
                  type={inputType}
                  placeholder={placeholder}
                  className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              )}
            />
            <FormField
              control={control}
              name={`${name}.${index}.enabled`}
              render={({ field: f }) => (
                <Switch checked={f.value} onCheckedChange={f.onChange} aria-label="Actif" />
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(index)}
              aria-label="Retirer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => append({ value: "", enabled: true })}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  )
}
