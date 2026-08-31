"use client"

import { type Control } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PaymentMethodSelect } from "@/components/admin/payments/PaymentMethodSelect"
import type { EnrollmentPaymentCreate } from "@/lib/contracts/payment"

/**
 * Le pied de la saisie d'un versement : moyen, référence, note interne.
 *
 * Les deux guichets (assistant de l'écran des versements, fiche de l'élève)
 * demandent exactement la même chose. Les dupliquer laissait deux formulaires
 * dériver l'un de l'autre au premier champ ajouté.
 */
export function PaymentDetailsFields({
  control,
}: {
  control: Control<EnrollmentPaymentCreate>
}) {
  return (
    <>
      <FormField
        control={control}
        name="method"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mode de paiement *</FormLabel>
            <FormControl>
              <PaymentMethodSelect
                value={field.value}
                onChange={(v) => field.onChange(v as EnrollmentPaymentCreate["method"])}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="reference"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Référence</FormLabel>
            <FormControl>
              <Input
                className="h-11"
                placeholder="Numéro de reçu ou de transaction (optionnel)"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                rows={2}
                placeholder="Note interne (optionnel)"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  )
}
