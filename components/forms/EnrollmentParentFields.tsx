"use client"

import type { UseFormReturn } from "react-hook-form"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { NewEnrollment } from "@/lib/contracts/enrollment"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const RELATIONSHIP_TYPES = [
  { value: "father", label: "Père" },
  { value: "mother", label: "Mère" },
  { value: "guardian", label: "Tuteur" },
  { value: "other", label: "Autre" },
] as const

interface EnrollmentParentFieldsProps {
  form: UseFormReturn<NewEnrollment>
  showParentFields: boolean
  showParentAccount: boolean
  onToggleParentFields: () => void
  onToggleParentAccount: (checked: boolean) => void
}

export function EnrollmentParentFields({
  form,
  showParentFields,
  showParentAccount,
  onToggleParentFields,
  onToggleParentAccount,
}: EnrollmentParentFieldsProps) {
  return (
    <>
        <Button
          type="button"
          variant="ghost"
          className="h-11 px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={onToggleParentFields}
        >
          {showParentFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Informations parent (optionnel)
        </Button>

        {showParentFields && (
          <div className="space-y-4 pl-2 border-l-2 border-muted">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parent.first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom du parent *</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parent.last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du parent *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parent.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Numéro de téléphone"
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parent.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Adresse email"
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parent.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex : Abidjan"
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parent.commune"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commune</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex : Cocody"
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="parent.relationship_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien de parenté</FormLabel>
                  <Select
                    value={field.value ?? "guardian"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="parent-create-account"
                  checked={showParentAccount}
                  onCheckedChange={(checked) => onToggleParentAccount(checked === true)}
                />
                <label
                  htmlFor="parent-create-account"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Créer un compte de connexion pour le parent
                </label>
              </div>

              {showParentAccount && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="parent.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email du compte *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@exemple.com"
                            className="h-11"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parent.password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="8 caractères minimum"
                            className="h-11"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        )}
    </>
  )
}
