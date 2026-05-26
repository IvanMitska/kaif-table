import { cn } from "@/lib/utils"
import { forwardRef, type SelectHTMLAttributes } from "react"

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-[12px] border border-[#ebe9e3] bg-white px-3 pr-10 text-[13.5px] text-[#1f1f1f] cursor-pointer",
            "transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "focus-visible:outline-none focus-visible:border-[#0a0a0a] focus-visible:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]",
            "disabled:cursor-not-allowed disabled:bg-[#faf9f5] disabled:text-[#9a9a98]",
            "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%239a9a98%22%20stroke-width%3D%221.8%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px] bg-[right_10px_center] bg-no-repeat",
            error && "border-[#fca5a5] focus-visible:border-[#dc2626] focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.08)]",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
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
Select.displayName = "Select"

export { Select }
