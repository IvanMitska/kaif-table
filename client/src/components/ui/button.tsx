import { cn } from "@/lib/utils"
import { type ButtonHTMLAttributes, forwardRef } from "react"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'lime'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs' | 'icon-sm'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "btn-press inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold tracking-[-0.005em]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efeee9]",
          "disabled:pointer-events-none disabled:opacity-45",
          {
            // Solid variants get a hairline inset highlight on top — adds depth without losing the flat aesthetic.
            'bg-[#0a0a0a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[#262626]': variant === 'default',
            'bg-[#dc2626] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:bg-[#b91c1c]': variant === 'destructive',
            'border border-[#ebe9e3] bg-white text-[#1f1f1f] hover:bg-[#faf9f5] hover:border-[#e0ddd4]': variant === 'outline',
            'bg-[#faf9f5] border border-[#ebe9e3] text-[#1f1f1f] hover:bg-[#f1f0ea] hover:border-[#e0ddd4]': variant === 'secondary',
            'text-[#6b6b6b] hover:bg-[#faf9f5] hover:text-[#0a0a0a]': variant === 'ghost',
            'text-[#6d28d9] underline-offset-4 hover:underline': variant === 'link',
            'bg-[#15803d] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:bg-[#166534]': variant === 'success',
            'bg-[#dcfa45] text-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_0_rgba(184,217,46,0.5)] hover:bg-[#d0ef30]': variant === 'lime',
          },
          {
            'h-7 px-2.5 text-[12px]': size === 'xs',
            'h-9 px-3.5 text-[12.5px]': size === 'sm',
            'h-10 px-[18px] text-[13.5px]': size === 'default',
            'h-11 px-6 text-sm': size === 'lg',
            'h-10 w-10 rounded-[10px] p-0': size === 'icon',
            'h-8 w-8 rounded-[9px] p-0': size === 'icon-sm',
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
