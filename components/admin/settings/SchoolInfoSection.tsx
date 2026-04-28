"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { SchoolInfoUpdateSchema, type SchoolInfoUpdate, type SchoolSettings } from "@/lib/contracts/settings"
import { useUpdateSchoolInfo } from "@/lib/hooks/useSettings"

interface SchoolInfoSectionProps {
  settings: SchoolSettings
}

export function SchoolInfoSection({ settings }: SchoolInfoSectionProps) {
  const { mutate, isPending } = useUpdateSchoolInfo()

  const form = useForm<SchoolInfoUpdate>({
    resolver: zodResolver(SchoolInfoUpdateSchema),
    defaultValues: {
      school_name: settings.school_name,
      address: settings.address ?? "",
      phone: settings.phone ?? "",
      email: settings.email ?? "",
      ministry_code: settings.ministry_code ?? "",
      head_master_name: settings.head_master_name ?? "",
      head_master_title: settings.head_master_title ?? "",
    },
  })

  function onSubmit(data: SchoolInfoUpdate) {
    mutate(data)
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Informations de l&apos;établissement</CardTitle>
            <p className="text-sm text-muted-foreground">Nom, adresse et coordonnées de l&apos;école</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="school_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l&apos;établissement *</FormLabel>
                    <FormControl>
                      <Input placeholder="Collège KLASSCI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ministry_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code ministere</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CI-DREN-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Avenue de l'École, Kinshasa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+225 ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@ecole.ci" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <p className="text-sm font-medium">Documents officiels</p>
              <p className="text-xs text-muted-foreground -mt-2">
                Apparaît sur les certificats, attestations et bulletins signés.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="head_master_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du chef d&apos;établissement</FormLabel>
                      <FormControl>
                        <Input placeholder="M. Konan Kouamé" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="head_master_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre / fonction</FormLabel>
                      <FormControl>
                        <Input placeholder="Directeur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </Form>

        {/* Pattern matricule (read-only display) */}
        <div className="mt-6 rounded-lg border p-4">
          <p className="text-sm font-medium">Pattern matricule</p>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {settings.enrollment_number_pattern || "Non configuré"}
          </p>
          {settings.enrollment_number_pattern && (
            <p className="mt-1 text-xs text-muted-foreground">
              Compteur actuel : {settings.enrollment_number_counter ?? 0}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Tokens disponibles : {"{YEAR}"}, {"{YEAR_SHORT}"}, {"{YEAR_RANGE}"}, {"{SEQ:04}"}, {"{SCHOOL}"}, {"{LEVEL}"}, {"{CLASS}"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
