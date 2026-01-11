import { cn } from "@/lib/utils"
import { type ButtonHTMLAttributes, forwardRef } from "react"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            'bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30': variant === 'default',
            'bg-red-500 text-white shadow-sm shadow-red-500/25 hover:bg-red-600 hover:shadow-md hover:shadow-red-500/30': variant === 'destructive',
            'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900': variant === 'outline',
            'bg-slate-100 text-slate-700 hover:bg-slate-200': variant === 'secondary',
            'text-slate-600 hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
            'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-500/30': variant === 'success',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-lg px-3 text-xs': size === 'sm',
            'h-11 rounded-lg px-6': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
