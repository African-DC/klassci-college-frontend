"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { NotificationUpdateSchema, type NotificationUpdate, type SchoolSettings } from "@/lib/contracts/settings"
import { useUpdateNotifications } from "@/lib/hooks/useSettings"

interface NotificationSectionProps {
  settings: SchoolSettings
}

export function NotificationSection({ settings }: NotificationSectionProps) {
  const { mutate, isPending } = useUpdateNotifications()

  const form = useForm<NotificationUpdate>({
    resolver: zodResolver(NotificationUpdateSchema),
    defaultValues: {
      notify_by_email: settings.notify_by_email,
      notify_by_sms: settings.notify_by_sms,
      notify_grades: settings.notify_grades,
      notify_absences: settings.notify_absences,
      notify_payments: settings.notify_payments,
    },
  })

  function onSubmit(data: NotificationUpdate) {
    mutate(data)
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Paramètres de notification</CardTitle>
            <p className="text-sm text-muted-foreground">Canaux et types de notifications envoyées</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Canaux */}
            <div className="space-y-4">
              <p className="text-sm font-semibold">Canaux de diffusion</p>
              <FormField
                control={form.control}
                name="notify_by_email"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Email</FormLabel>
                      <FormDescription className="text-xs">
                        Envoyer les notifications par email aux parents
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notify_by_sms"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">SMS</FormLabel>
                      <FormDescription className="text-xs">
                        Envoyer les notifications par SMS aux parents
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Types */}
            <div className="space-y-4">
              <p className="text-sm font-semibold">Types de notifications</p>
              <FormField
                control={form.control}
                name="notify_grades"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Notes</FormLabel>
                      <FormDescription className="text-xs">
                        Notifier quand de nouvelles notes sont publiées
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notify_absences"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Absences</FormLabel>
                      <FormDescription className="text-xs">
                        Notifier les parents en cas d&apos;absence
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notify_payments"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Paiements</FormLabel>
                      <FormDescription className="text-xs">
                        Notifier lors de la réception d&apos;un paiement
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
