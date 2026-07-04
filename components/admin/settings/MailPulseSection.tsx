"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Activity,
  KeyRound,
  Loader2,
  MessageCircle,
  Radio,
  Send,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { DataError } from "@/components/shared/DataError"
import { MailPulseConfigFormSchema, type MailPulseConfigForm } from "@/lib/contracts/mailpulse"
import { useMailPulseConfig, useUpdateMailPulse } from "@/lib/hooks/useMailPulse"
import { MailPulseRecipientList } from "./mailpulse/MailPulseRecipientList"
import { MailPulseTestPanel } from "./mailpulse/MailPulseTestPanel"

/** Barre d'en-tête d'une sous-section (couche 4). */
function SectionBar({ icon: Icon, title }: { icon: typeof Zap; title: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b pb-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#f5821f] to-[#f9a826] text-white shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="text-sm font-semibold">{title}</h2>
    </div>
  )
}

export function MailPulseSection() {
  const { data: config, isLoading, isError, refetch } = useMailPulseConfig()
  const { mutate, isPending } = useUpdateMailPulse()

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />
  if (isError || !config)
    return (
      <DataError message="Impossible de charger la configuration MailPulse." onRetry={() => refetch()} />
    )

  return <MailPulseForm config={config} save={mutate} saving={isPending} />
}

function MailPulseForm({
  config,
  save,
  saving,
}: {
  config: NonNullable<ReturnType<typeof useMailPulseConfig>["data"]>
  save: (data: MailPulseConfigForm) => void
  saving: boolean
}) {
  const form = useForm<MailPulseConfigForm>({
    resolver: zodResolver(MailPulseConfigFormSchema),
    defaultValues: {
      enabled: config.enabled,
      base_url: config.base_url,
      api_key: "",
      sender_email: config.sender_email ?? "",
      sender_name: config.sender_name ?? "",
      default_language: config.default_language,
      timeout: config.timeout,
      real_workflows_enabled: config.real_workflows_enabled,
      test_email_enabled: config.test_email_enabled,
      test_whatsapp_enabled: config.test_whatsapp_enabled,
      test_email_recipients: config.test_email_recipients,
      test_phone_recipients: config.test_phone_recipients,
      inbound_secret: "",
    },
  })

  const enabled = form.watch("enabled")

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border">
        {/* En-tête identitaire MailPulse */}
        <div className="flex items-center gap-4 border-b bg-gradient-to-r from-[#fff7ed] to-transparent p-5 dark:from-[#f5821f]/10">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#f5821f] to-[#f9a826] text-white shadow-sm">
            <Radio className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">MailPulse</h2>
              <Badge
                className={
                  enabled
                    ? "bg-emerald-600 text-white hover:bg-emerald-600"
                    : "bg-muted text-muted-foreground hover:bg-muted"
                }
              >
                {enabled ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Notifications aux parents par email et WhatsApp
            </p>
          </div>
        </div>

        <CardContent className="p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => save(d))} className="space-y-6">
              {/* Interrupteur maître */}
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold">Activer MailPulse</FormLabel>
                      <FormDescription className="text-xs">
                        Permet les envois de test et, si les workflows réels sont activés, les
                        notifications automatiques.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Connexion */}
              <section className="space-y-4">
                <SectionBar icon={KeyRound} title="Connexion" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="base_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">URL MailPulse</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-11 sm:h-10" placeholder="https://..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Clé d&apos;accès</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="off"
                            className="h-11 sm:h-10"
                            placeholder={
                              config.api_key_set
                                ? "•••••••• enregistrée, laissez vide pour conserver"
                                : "Coller la clé MailPulse"
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sender_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Nom expéditeur</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-11 sm:h-10" placeholder="Lycée Saint-Augustin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sender_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Email expéditeur</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className="h-11 sm:h-10"
                            placeholder="noreply@ecole.ci"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Destinataires de test */}
              <section className="space-y-4">
                <SectionBar icon={Send} title="Destinataires de test" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <FormField
                      control={form.control}
                      name="test_email_enabled"
                      render={({ field }) => (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Emails de test</p>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />
                    <MailPulseRecipientList
                      control={form.control}
                      name="test_email_recipients"
                      placeholder="test@ecole.ci"
                      inputType="email"
                      addLabel="Ajouter un email"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <FormField
                      control={form.control}
                      name="test_whatsapp_enabled"
                      render={({ field }) => (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Numéros WhatsApp de test</p>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />
                    <MailPulseRecipientList
                      control={form.control}
                      name="test_phone_recipients"
                      placeholder="+225 07 00 00 00 00"
                      inputType="tel"
                      addLabel="Ajouter un numéro"
                    />
                  </div>
                </div>
              </section>

              {/* Workflows réels */}
              <section className="space-y-3">
                <SectionBar icon={Zap} title="Envois réels aux parents" />
                <FormField
                  control={form.control}
                  name="real_workflows_enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                          Notifier les vrais parents
                        </FormLabel>
                        <FormDescription className="text-xs text-amber-800 dark:text-amber-300/80">
                          Une fois activé, un paiement, une absence ou une note déclenche l&apos;envoi
                          aux parents concernés (selon les canaux de l&apos;établissement).
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </section>

              {/* Réponse INFO WhatsApp */}
              <section className="space-y-3">
                <SectionBar icon={MessageCircle} title="Réponse WhatsApp « INFO »" />
                <p className="text-xs text-muted-foreground">
                  Un parent écrit <strong>INFO</strong> sur le WhatsApp de l&apos;école et reçoit la
                  synthèse de ses enfants (classe, moyenne, absences, reste à payer). Renseignez un
                  secret partagé, à communiquer à MailPulse pour sécuriser le relais.
                </p>
                <FormField
                  control={form.control}
                  name="inbound_secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Secret du webhook entrant</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="off"
                          className="h-11 sm:h-10"
                          placeholder={
                            config.inbound_secret_set
                              ? "•••••••• enregistré, laissez vide pour conserver"
                              : "Définir un secret (ex: chaîne aléatoire longue)"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Clé et secret ne sont jamais réaffichés.
                </p>
                <Button type="submit" disabled={saving} className="h-11 sm:h-10">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Panneau de test — hors du formulaire de config */}
      <MailPulseTestPanel />

      <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
        <Activity className="h-3.5 w-3.5 text-[#f5821f]" />
        Propulsé par MailPulse, la plateforme de messagerie de KLASSCI.
      </p>
    </div>
  )
}
