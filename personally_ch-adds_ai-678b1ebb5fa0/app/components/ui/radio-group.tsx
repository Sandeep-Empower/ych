import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{
  value: string
  setValue: (value: string) => void
} | null>(null)

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

export function RadioGroup({ value, onValueChange, children, className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, setValue: onValueChange }}>
      <div role="radiogroup" className={cn("flex gap-4", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  id: string
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value, id, className, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    if (!context) throw new Error("RadioGroupItem must be used within a RadioGroup")
    const checked = context.value === value
    return (
      <input
        type="radio"
        id={id}
        value={value}
        checked={checked}
        onChange={() => context.setValue(value)}
        ref={ref}
        className={cn(
          "w-4 h-4 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-cyan-500 transition-colors",
          checked ? "bg-cyan-600 border-cyan-600" : "bg-white",
          className
        )}
        {...props}
      />
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem" 