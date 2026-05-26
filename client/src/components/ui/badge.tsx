import { cn } from "@/lib/utils"
import { type HTMLAttributes } from "react"

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        {
          'bg-[#f3effc] text-[#6d28d9] border border-[#e6dcfa]': variant === 'default',
          'bg-[#faf9f5] text-[#6b6b6b] border border-[#ebe9e3]': variant === 'secondary',
          'bg-[#fef2f2] text-[#be123c] border border-[#fee2e2]': variant === 'destructive',
          'bg-transparent text-[#6b6b6b] border border-[#d8d6cf]': variant === 'outline',
          'bg-[#ecfdf5] text-[#15803d] border border-[#d1fae5]': variant === 'success',
          'bg-[#fffbeb] text-[#b45309] border border-[#fef3c7]': variant === 'warning',
        },
        className
      )}
      {...props}
    />
  )
}
