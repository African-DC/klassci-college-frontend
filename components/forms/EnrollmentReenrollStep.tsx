"use client"

import type { UseFormReturn } from "react-hook-form"
import type { ReEnrollment } from "@/lib/contracts/enrollment"
import type { Student } from "@/lib/contracts/student"
import { Card, CardContent } from "@/components/ui/card"
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

interface EnrollmentReenrollStepProps {
  form: UseFormReturn<ReEnrollment>
  students: Student[]
  studentsLoading: boolean
  selectedStudent?: Student
}

export function EnrollmentReenrollStep({
  form,
  students,
  studentsLoading,
  selectedStudent,
}: EnrollmentReenrollStepProps) {
  return (
    <Form {...form}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sélectionnez l&apos;élève à réinscrire.
        </p>

        <FormField
          control={form.control}
          name="student_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Élève *</FormLabel>
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={studentsLoading ? "Chargement..." : "Sélectionner un élève"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={String(student.id)}>
                      {student.first_name} {student.last_name}
                      {student.enrollment_number ? ` (${student.enrollment_number})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedStudent ? (
          <Card>
            <CardContent className="pt-4 pb-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Nom complet</dt>
                <dd className="font-medium">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </dd>
                {selectedStudent.enrollment_number ? (
                  <>
                    <dt className="text-muted-foreground">Matricule</dt>
                    <dd>{selectedStudent.enrollment_number}</dd>
                  </>
                ) : null}
                {selectedStudent.genre ? (
                  <>
                    <dt className="text-muted-foreground">Genre</dt>
                    <dd>{selectedStudent.genre === "M" ? "Masculin" : "Féminin"}</dd>
                  </>
                ) : null}
                {selectedStudent.birth_date ? (
                  <>
                    <dt className="text-muted-foreground">Date de naissance</dt>
                    <dd>{selectedStudent.birth_date}</dd>
                  </>
                ) : null}
              </dl>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </Form>
  )
}
