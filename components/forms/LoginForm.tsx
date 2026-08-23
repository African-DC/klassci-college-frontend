"use client"

import { useEffect, useState } from "react"
import type { Route } from "next"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Clock, Building2 } from "lucide-react"
import { LoginRequestSchema, type LoginRequest } from "@/lib/contracts/auth"
import { resolveSchoolLoginCode } from "@/lib/utils/tenant-slug"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const TENANT_CODE_COOKIE = "tenant_code"
const SCHOOL_CODE_COOKIE = "school_code"

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
  if (!match) return null
  return decodeURIComponent(match.slice(name.length + 1))
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${secure}`
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl") ?? "/"
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/"
  const sessionExpired = searchParams.get("expired") === "1"
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [resolvedSchool, setResolvedSchool] = useState<string | null>(null)

  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      school_code: "",
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    const fromUrl = searchParams.get("c")
    const rememberedSchool = readCookie(SCHOOL_CODE_COOKIE)
    const rememberedTenant = readCookie(TENANT_CODE_COOKIE)
    const initial = fromUrl || rememberedSchool || rememberedTenant || ""
    const resolved = resolveSchoolLoginCode(initial)
    if (initial) {
      form.setValue("school_code", fromUrl ? fromUrl.toUpperCase() : rememberedSchool || initial.toUpperCase())
    }
    setResolvedSchool(resolved)
  }, [form, searchParams])

  async function onSubmit(data: LoginRequest) {
    setError(null)
    const tenantCode = resolveSchoolLoginCode(data.school_code)
    if (!tenantCode) {
      setError("Code établissement inconnu. Exemple : ROSTAN")
      return
    }

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        tenant_code: tenantCode,
        redirect: false,
      })

      if (result?.error) {
        setError("Email ou mot de passe incorrect")
        return
      }

      writeCookie(TENANT_CODE_COOKIE, tenantCode)
      writeCookie(SCHOOL_CODE_COOKIE, data.school_code.trim().toUpperCase())

      router.push(callbackUrl as Route)
      router.refresh()
    } catch {
      setError("Erreur de connexion au serveur")
    }
  }

  return (
    <Form {...form}>
      {/* `method="post"` n'est jamais emprunté une fois que React écoute, mais il
          décide de ce qui arrive avant. Entre l'affichage du HTML et l'exécution du
          bundle, le bouton existe déjà et personne n'intercepte : un clic déclenche
          la soumission native du navigateur, qui sans `method` est un GET. Le mot de
          passe part alors dans l'URL, donc dans l'historique, dans les journaux du
          serveur et, pour une requête de même origine, dans l'en-tête Referer de la
          page suivante. La fenêtre est étroite, et elle s'allonge exactement là où la
          connexion est lente. */}
      <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {sessionExpired && !error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 dark:border-amber-900/40 dark:bg-amber-950/30"
          >
            <Clock aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Session expirée
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Pour des raisons de sécurité, reconnectez-vous pour continuer.
              </p>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="school_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Code établissement</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="ROSTAN"
                    autoComplete="organization"
                    inputMode="text"
                    aria-required="true"
                    className="h-11 pl-10 uppercase"
                    {...field}
                    onChange={(event) => {
                      field.onChange(event.target.value.toUpperCase())
                      setResolvedSchool(resolveSchoolLoginCode(event.target.value))
                    }}
                  />
                </div>
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {resolvedSchool
                  ? `École reconnue : ${resolvedSchool}`
                  : "Le code donné par KLASSCI, pas l'adresse complète."}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Adresse email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="nom@etablissement.ci"
                    autoComplete="email"
                    inputMode="email"
                    aria-required="true"
                    className="h-11 pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    autoComplete="current-password"
                    aria-required="true"
                    className="h-11 pl-10 pr-11"
                    {...field}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3"
          >
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full h-11 text-sm font-semibold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            "Connexion en cours..."
          ) : (
            <>
              Se connecter
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
