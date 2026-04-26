---
name: new-page
description: Scaffold a new Next.js App Router page with layout, loading, error boundaries, and proper portal routing. Use when asked to add a new page.
argument-hint: "[portal/path] e.g. admin/enrollments"
---

Scaffold a new Next.js App Router page: $ARGUMENTS

## Step 1 — Determine the portal and path
- `admin/*` → `app/(admin)/$ARGUMENTS/`
- `teacher/*` → `app/(teacher)/$ARGUMENTS/`
- `student/*` → `app/(student)/$ARGUMENTS/`
- `parent/*` → `app/(parent)/$ARGUMENTS/`

## Step 2 — Read an existing page in the same portal
Use Glob to find `app/(admin)/*/page.tsx` and read it for conventions.

## Step 3 — Create the files

### `page.tsx` — Server Component (default)
```tsx
import { Suspense } from "react"
import { {Resource}Table } from "@/components/admin/{domain}"
import { {Resource}TableSkeleton } from "@/components/admin/{domain}"
import { CreateButton } from "@/components/shared/CreateButton"

export const metadata = { title: "... | KLASSCI" }

export default function {Resource}Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">...</h1>
        <CreateButton resource="{resource}" />
      </div>
      <Suspense fallback={<{Resource}TableSkeleton />}>
        <{Resource}Table />
      </Suspense>
    </div>
  )
}
```

### `loading.tsx` — Shown while page loads
```tsx
import { {Resource}TableSkeleton } from "@/components/admin/{domain}"
export default function Loading() {
  return <{Resource}TableSkeleton />
}
```

### `error.tsx` — Error boundary
```tsx
"use client"
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-destructive">{error.message}</p>
      <button onClick={reset}>Réessayer</button>
    </div>
  )
}
```

## Step 4 — Add to navigation
Add the new page to the sidebar navigation in `components/shared/Sidebar.tsx`.

$ARGUMENTS
