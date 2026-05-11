"use client"

import { useEffect, useState } from "react"
import type { Route } from "next"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react"
import { LoginRequestSchema, type LoginRequest } from "@/lib/contracts/auth"
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

// Cookie used to remember the tenant slug between visits (so the user
// who first arrived via a WhatsApp link doesn't need the ?c= every time).
// Not HttpOnly: the slug is non-sensitive (also visible in the URL) and
// must be readable from client JS to pre-fill the signIn call.
const TENANT_CODE_COOKIE = "tenant_code"
// RFC 1123 slug : 2-63 lowercase alnum + hyphen, no leading/trailing hyphen.
// Mirror of the BE regex in app/core/slug.py.
const TENANT_SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/

function isValidTenantSlug(value: string): boolean {
  return TENANT_SLUG_REGEX.test(value)
}

function readTenantCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TENANT_CODE_COOKIE}=`))
  if (!match) return null
  const value = decodeURIComponent(match.slice(TENANT_CODE_COOKIE.length + 1))
  return isValidTenantSlug(value) ? value : null
}

function writeTenantCookie(slug: string): void {
  if (typeof document === "undefined") return
  if (!isValidTenantSlug(slug)) return
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${TENANT_CODE_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=31536000; SameSite=Lax${secure}`
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl") ?? "/"
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/"
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [tenantCode, setTenantCode] = useState<string | null>(null)

  useEffect(() => {
    const fromUrl = searchParams.get("c")
    if (fromUrl && isValidTenantSlug(fromUrl)) {
      setTenantCode(fromUrl)
      return
    }
    setTenantCode(readTenantCookie())
  }, [searchParams])

  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginRequest) {
    setError(null)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        tenant_code: tenantCode ?? "",
        redirect: false,
      })

      if (result?.error) {
        setError("Email ou mot de passe incorrect")
        return
      }

      if (tenantCode) writeTenantCookie(tenantCode)

      router.push(callbackUrl as Route)
      router.refresh()
    } catch {
      setError("Erreur de connexion au serveur")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {tenantCode && (
          <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Établissement : </span>
            <span className="font-mono font-medium text-primary">{tenantCode}</span>
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Adresse email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="nom@etablissement.cd"
                    autoComplete="email"
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
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Mot de passe</FormLabel>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  tabIndex={-1}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    autoComplete="current-password"
                    className="h-11 pl-10 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
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
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
