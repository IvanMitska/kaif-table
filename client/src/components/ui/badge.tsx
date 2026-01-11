import { cn } from "@/lib/utils"
import { type HTMLAttributes } from "react"

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          'bg-primary/10 text-primary border border-primary/20': variant === 'default',
          'bg-slate-100 text-slate-600 border border-slate-200': variant === 'secondary',
          'bg-red-50 text-red-600 border border-red-100': variant === 'destructive',
          'bg-transparent text-slate-600 border border-slate-300': variant === 'outline',
          'bg-emerald-50 text-emerald-600 border border-emerald-100': variant === 'success',
          'bg-amber-50 text-amber-600 border border-amber-100': variant === 'warning',
        },
        className
      )}
      {...props}
    />
  )
}
