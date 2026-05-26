import { cn } from "@/lib/utils"
import { forwardRef, type InputHTMLAttributes } from "react"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-[12px] border border-[#ebe9e3] bg-white px-3 text-[13.5px] text-[#1f1f1f]",
            "transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "file:border-0 file:bg-transparent file:text-[13px] file:font-medium",
            "placeholder:text-[#9a9a98]",
            "hover:border-[#e0ddd4]",
            "focus-visible:outline-none focus-visible:border-[#0a0a0a] focus-visible:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]",
            "disabled:cursor-not-allowed disabled:bg-[#faf9f5] disabled:text-[#9a9a98] disabled:hover:border-[#ebe9e3]",
            error && "border-[#fca5a5] hover:border-[#f87171] focus-visible:border-[#dc2626] focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.08)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-[12px] text-[#dc2626] flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
