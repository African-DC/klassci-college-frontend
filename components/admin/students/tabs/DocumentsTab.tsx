"use client"

import { FileText } from "lucide-react"

interface DocumentsTabProps {
  studentId: number
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DocumentsTab({ studentId }: DocumentsTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        Aucun document. L&apos;upload de documents sera disponible prochainement.
      </p>
    </div>
  )
}
