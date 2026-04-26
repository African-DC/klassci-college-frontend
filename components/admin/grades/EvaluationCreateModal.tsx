"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShieldAlert } from "lucide-react"
import { EvaluationCreateSchema, type EvaluationCreate } from "@/lib/contracts/grade"
import { useCreateEvaluation } from "@/lib/hooks/useGrades"
import { useClasses } from "@/lib/hooks/useClasses"
import { useSubjects } from "@/lib/hooks/useSubjects"
import { useTeachers } from "@/lib/hooks/useTeachers"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EVALUATION_TYPES: { value: EvaluationCreate["type"]; label: string }[] = [
  { value: "controle", label: "Contrôle" },
  { value: "devoir", label: "Devoir" },
  { value: "examen", label: "Examen" },
  { value: "oral", label: "Oral" },
]

interface EvaluationCreateModalProps {
  open: boolean
  onClose: () => void
  defaultClassId?: number | null
}

/**
 * Création d'évaluation côté admin (délégation).
 *
 * Différence vs portail teacher : l'admin doit explicitement choisir
 * l'enseignant titulaire (teacher_id) puisqu'il n'a pas de teacher_profile.
 * Le BE auto-résoudra teacher_id pour un prof, mais l'exigera de l'admin.
 *
 * Banner ambre rappelle que la saisie sera tracée comme déléguée
 * (entered_by_user_id côté audit trail).
 */
export function EvaluationCreateModal({
  open,
  onClose,
  defaultClassId,
}: EvaluationCreateModalProps) {
  const { data: classesData } = useClasses({ size: 100 })
  const { data: subjectsData } = useSubjects({ size: 100 })
  const { data: teachersData } = useTeachers({ size: 200 })
  const { data: yearsData } = useAcademicYears({ size: 20 })

  const classes = classesData?.items ?? []
  const subjects = subjectsData?.items ?? []
  const teachers = useMemo(() => {
    const list = teachersData?.items ?? []
    return [...list].sort((a, b) => {
      const an = `${a.last_name} ${a.first_name}`.toLowerCase()
      const bn = `${b.last_name} ${b.first_name}`.toLowerCase()
      return an.localeCompare(bn)
    })
  }, [teachersData])
  const years = yearsData?.items ?? []
  const currentYear = years.find((y) => y.is_current) ?? years[0]

  const form = useForm<EvaluationCreate>({
    resolver: zodResolver(EvaluationCreateSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().slice(0, 10),
      coefficient: 1,
      trimester: 1,
      class_id: defaultClassId ?? undefined,
      academic_year_id: currentYear?.id,
    },
  })

  // Pre-fill academic_year_id once years arrive (form already initialized with possibly-undefined).
  useEffect(() => {
    if (currentYear && !form.getValues("academic_year_id")) {
      form.setValue("academic_year_id", currentYear.id, { shouldValidate: true })
    }
  }, [currentYear, form])

  // Reset on open with the latest defaults.
  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        type: undefined as unknown as EvaluationCreate["type"],
        date: new Date().toISOString().slice(0, 10),
        coefficient: 1,
        trimester: 1,
        class_id: defaultClassId ?? undefined,
        subject_id: undefined as unknown as number,
        teacher_id: undefined,
        academic_year_id: currentYear?.id,
      })
    }
  }, [open, defaultClassId, currentYear, form])

  const { mutate, isPending, error } = useCreateEvaluation()

  function onSubmit(data: EvaluationCreate) {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        onClose()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-serif">Nouvelle évaluation</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p>
            Vous créez l&apos;évaluation au nom d&apos;un enseignant titulaire.
            L&apos;audit système enregistre votre intervention pour traçabilité.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex : Devoir n°1 — Mathématiques" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classe *</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Choisir une classe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                            {c.level_name ? ` · ${c.level_name}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matière *</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Choisir une matière" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enseignant titulaire *</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choisir l'enseignant titulaire" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[260px]">
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.last_name.toUpperCase()} {t.first_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVALUATION_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trimester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trimestre *</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="T?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Trimestre 1</SelectItem>
                        <SelectItem value="2">Trimestre 2</SelectItem>
                        <SelectItem value="3">Trimestre 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="coefficient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coefficient *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        className="h-11"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="academic_year_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année scolaire *</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Année" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y.id} value={String(y.id)}>
                            {y.label ?? y.name}
                            {y.is_current ? " · en cours" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
                <p className="text-sm text-destructive">{error.message}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-11 font-semibold"
              disabled={isPending}
            >
              {isPending ? "Création…" : "Créer l'évaluation"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
