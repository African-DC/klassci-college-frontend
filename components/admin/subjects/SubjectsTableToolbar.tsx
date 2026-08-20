"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LevelOption {
  id: number
  name: string
}

interface ToolbarValue {
  search: string
  levelFilter: string
  teacherFilter: string
}

interface ToolbarHandlers {
  onSearchChange: (value: string) => void
  onLevelFilterChange: (value: string) => void
  onTeacherFilterChange: (value: string) => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

interface Props {
  value: ToolbarValue
  levels: LevelOption[]
  handlers: ToolbarHandlers
}

export function SubjectsTableToolbar({ value, levels, handlers }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher matière ou enseignant..."
          value={value.search}
          onChange={(e) => handlers.onSearchChange(e.target.value)}
          className="h-11 pl-9 md:h-10"
          aria-label="Rechercher une matière"
        />
      </div>

      <Select value={value.levelFilter} onValueChange={handlers.onLevelFilterChange}>
        <SelectTrigger className="h-11 min-w-[170px] md:h-10" aria-label="Filtrer par niveau">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous niveaux</SelectItem>
          <SelectItem value="catalogue">Catalogue seul</SelectItem>
          {levels.map((level) => (
            <SelectItem key={level.id} value={String(level.id)}>
              {level.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.teacherFilter} onValueChange={handlers.onTeacherFilterChange}>
        <SelectTrigger className="h-11 min-w-[180px] md:h-10" aria-label="Filtrer par enseignant">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous enseignants</SelectItem>
          <SelectItem value="with">Avec enseignant</SelectItem>
          <SelectItem value="without">Sans enseignant</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-auto hidden items-center gap-1 md:flex">
        <Button variant="ghost" size="sm" onClick={handlers.onExpandAll}>Tout déplier</Button>
        <Button variant="ghost" size="sm" onClick={handlers.onCollapseAll}>Tout replier</Button>
      </div>
    </div>
  )
}