"use client"

import type { UseFormReturn } from "react-hook-form"
import { ExternalLink, Info, Settings2 } from "lucide-react"
import type { NewEnrollment } from "@/lib/contracts/enrollment"
import { StudentPhotoField } from "@/components/admin/students/photo/StudentPhotoField"
import { EnrollmentParentFields } from "@/components/forms/EnrollmentParentFields"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Form,
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

interface EnrollmentNewStudentStepProps {
  form: UseFormReturn<NewEnrollment>
  photo: File | null
  onPhotoChange: (file: File | null) => void
  disabled?: boolean
  showParentFields: boolean
  showParentAccount: boolean
  onToggleParentFields: () => void
  onToggleParentAccount: (checked: boolean) => void
}

export function EnrollmentNewStudentStep({
  form,
  photo,
  onPhotoChange,
  disabled = false,
  showParentFields,
  showParentAccount,
  onToggleParentFields,
  onToggleParentAccount,
}: EnrollmentNewStudentStepProps) {
  return (
    <Form {...form}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Renseignez les informations de l&apos;élève.
        </p>

        <StudentPhotoField value={photo} onChange={onPhotoChange} disabled={disabled} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom *</FormLabel>
                <FormControl>
                  <Input placeholder="Prénom de l'élève" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder="Nom de l'élève" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birth_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de naissance</FormLabel>
                <FormControl>
                  <Input
                    type="date"
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
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || null)}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="enrollment_number"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Matricule *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="rounded-full p-0.5 hover:bg-muted transition-colors">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 text-xs" side="top" align="start">
                    <p className="font-medium mb-1">Configuration du matricule</p>
                    <p className="text-muted-foreground">
                      Le matricule peut être généré automatiquement si un pattern est configuré dans les paramètres.
                    </p>
                    <a
                      href="/admin/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Settings2 className="h-3 w-3" />
                      Configurer le pattern
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </PopoverContent>
                </Popover>
              </div>
              <FormControl>
                <Input
                  placeholder="Ex: KLASSCI-2026-0001"
                  className="h-11"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Laissez vide pour une génération automatique (si le pattern est configuré).
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
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
            name="commune"
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

        <Separator />

        <EnrollmentParentFields
          form={form}
          showParentFields={showParentFields}
          showParentAccount={showParentAccount}
          onToggleParentFields={onToggleParentFields}
          onToggleParentAccount={onToggleParentAccount}
        />
      </div>
    </Form>
  )
}
