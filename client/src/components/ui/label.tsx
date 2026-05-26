import { cn } from "@/lib/utils"
import { forwardRef, type LabelHTMLAttributes } from "react"

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-[12.5px] font-medium text-[#6b6b6b] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }
