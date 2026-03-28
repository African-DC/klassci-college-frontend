"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClassCreateSchema, type ClassCreate } from "@/lib/contracts/class"
import { useCreateClass } from "@/lib/hooks/useClasses"
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
import { useTeachers } from "@/lib/hooks/useTeachers"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"

interface ClassFormProps {
  onSuccess: () => void
}

export function ClassForm({ onSuccess }: ClassFormProps) {
  const form = useForm<ClassCreate>({
    resolver: zodResolver(ClassCreateSchema),
    defaultValues: {
      name: "",
      level: "",
      section: "",
      capacity: undefined,
      academic_year_id: undefined,
      teacher_id: undefined,
    },
  })

  const { data: teachersData } = useTeachers({ per_page: 200 })
  const { data: academicYears } = useAcademicYears()
  const { mutate, isPending, error } = useCreateClass()

  function onSubmit(data: ClassCreate) {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        onSuccess()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la classe *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : 6ème A" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex : 6ème" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section</FormLabel>
                <FormControl>
                  <Input placeholder="Ex : A" className="h-11" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacité</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="Ex : 45"
                  className="h-11"
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="teacher_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titulaire</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                value={field.value?.toString() ?? ""}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Sélectionner un enseignant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teachersData?.data.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.last_name} {t.first_name}
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
          name="academic_year_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Année académique</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                value={field.value?.toString() ?? ""}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Sélectionner une année" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {academicYears?.map((ay) => (
                    <SelectItem key={ay.id} value={ay.id.toString()}>
                      {ay.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full h-11 font-semibold" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Enregistrer la classe"}
        </Button>
      </form>
    </Form>
  )
}
