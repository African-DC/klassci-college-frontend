"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus, KeyRound } from "lucide-react"
import { ParentCreateSchema, type ParentCreate } from "@/lib/contracts/parent"
import { useCreateParent, useLinkParent } from "@/lib/hooks/useParents"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RELATIONSHIPS } from "./relationship"

interface ParentCreateModalProps {
  studentId: number
  open: boolean
  onClose: () => void
}

export function ParentCreateModal({ studentId, open, onClose }: ParentCreateModalProps) {
  const [createAccount, setCreateAccount] = useState(false)
  const { mutate: createParent, isPending: creating } = useCreateParent()
  const { mutate: linkParent, isPending: linking } = useLinkParent()

  const form = useForm<ParentCreate>({
    resolver: zodResolver(ParentCreateSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      password: "",
      relationship_type: "guardian",
    },
  })

  const handleClose = () => {
    form.reset()
    setCreateAccount(false)
    onClose()
  }

  const handleSubmit = (data: ParentCreate) => {
    const payload: ParentCreate = { ...data }
    if (!createAccount) {
      delete payload.password
    }
    createParent(payload, {
      onSuccess: (parent) => {
        linkParent(
          { parentId: parent.id, studentId, relationshipType: data.relationship_type },
          { onSuccess: handleClose },
        )
      },
    })
  }

  const isPending = creating || linking

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <UserPlus className="h-5 w-5 text-primary" />
            Nouveau parent
          </DialogTitle>
          <DialogDescription>
            Créez un parent et liez-le immédiatement à l&apos;élève.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom" className="h-11 sm:h-10" {...field} />
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
                      <Input placeholder="Nom" className="h-11 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+225 ..."
                        className="h-11 font-mono sm:h-10"
                        {...field}
                        value={field.value ?? ""}
                      />
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
                      <Input
                        type="email"
                        placeholder="parent@exemple.com"
                        className="h-11 sm:h-10"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="relationship_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien de parenté</FormLabel>
                  <Select value={field.value ?? "guardian"} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RELATIONSHIPS.map((r) => (
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

            {/* Compte utilisateur optionnel */}
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  checked={createAccount}
                  onCheckedChange={(checked) => {
                    setCreateAccount(checked === true)
                    if (!checked) form.setValue("password", "")
                  }}
                  className="mt-0.5"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    Créer un compte de connexion
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Permet au parent d&apos;accéder à son portail (notes, paiements, bulletins).
                  </span>
                </span>
              </label>

              {createAccount && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe initial *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="8 caractères minimum"
                          className="h-11 sm:h-10"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11 sm:h-10"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending} className="h-11 sm:h-10">
                {isPending ? "Création..." : "Créer et lier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
