import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // `min-w-0` : un champ `type="date"` de WebKit a une largeur minimale
          // intrinsèque — le gabarit jj/mm/aaaa et son bouton natif — et refuse
          // de rétrécir en dessous. Dans une grille ou un flex, la piste se
          // dimensionne alors sur cette largeur et déborde sa carte, `w-full`
          // n'y changeant rien puisqu'il vaut 100 % d'une piste déjà trop large.
          // Vingt-deux écrans portent un champ de date ; la correction vit donc
          // ici plutôt qu'à vingt-deux endroits.
          "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
