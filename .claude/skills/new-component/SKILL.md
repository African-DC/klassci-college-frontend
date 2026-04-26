---
name: new-component
description: Scaffold a new React component following KLASSCI conventions (Server/Client decision, Skeleton, Modal pattern). Use when asked to create a new component.
argument-hint: "[ComponentName] [type: page-section|modal|table|card|form]"
---

Scaffold a new component: $ARGUMENTS

## Step 1 — Determine type and location
- `modal` → `components/admin/{domain}/{Name}Modal.tsx` — always `"use client"`
- `table` → `components/admin/{domain}/{Name}Table.tsx` — may be server or client
- `card` → `components/admin/{domain}/{Name}Card.tsx` — server if no interactivity
- `form` → `components/forms/{domain}/{Name}Form.tsx` — always `"use client"`
- `page-section` → `components/admin/{domain}/{Name}Section.tsx`

## Step 2 — Read similar existing component first
Use Glob to find an existing component of the same type and read it to match conventions.

## Step 3 — Create the component

### For modals:
```tsx
"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface {Name}ModalProps {
  open: boolean
  onClose: () => void
  // other props
}

export function {Name}Modal({ open, onClose }: {Name}ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>...</DialogTitle>
        </DialogHeader>
        {/* content */}
      </DialogContent>
    </Dialog>
  )
}
```

### For tables (with TanStack Table):
```tsx
"use client"
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
```

## Step 4 — Create the Skeleton companion
Always create a `{Name}Skeleton.tsx` next to the component.

## Step 5 — Export from domain index
Add export to `components/admin/{domain}/index.ts`

$ARGUMENTS
