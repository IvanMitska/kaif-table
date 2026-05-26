import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Выберите...",
  className,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Calculate popup position
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const popupHeight = Math.min(options.length * 40 + 12, 300) // approximate height
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      let top: number
      if (spaceBelow >= popupHeight || spaceBelow >= spaceAbove) {
        // Show below
        top = rect.bottom + 6
      } else {
        // Show above
        top = rect.top - popupHeight - 6
      }

      setPopupPosition({
        top: top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [isOpen, options.length])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  const dropdownPopup = isOpen ? (
    <div
      ref={popupRef}
      className="fixed z-[9999] animate-dropdownIn"
      style={{
        top: popupPosition.top,
        left: popupPosition.left,
        minWidth: Math.max(popupPosition.width, 180),
      }}
    >
      <div className="scroll-refined rounded-[14px] border border-[#ebe9e3] bg-white p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-h-[300px] overflow-auto">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value)
              setIsOpen(false)
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-[13px] transition-colors duration-150",
              "hover:bg-[#faf9f5]",
              option.value === value
                ? "text-[#0a0a0a] font-medium bg-[#faf9f5]"
                : "text-[#6b6b6b]"
            )}
          >
            <span className="w-4 flex-shrink-0">
              {option.value === value && (
                <Check className="h-4 w-4 text-[#0a0a0a]" strokeWidth={2} />
              )}
            </span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  ) : null

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-[12px] border border-[#ebe9e3] bg-white px-3 text-[13.5px] text-[#1f1f1f]",
          "transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "hover:border-[#e0ddd4] focus:outline-none focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]",
          disabled && "cursor-not-allowed bg-[#faf9f5] text-[#9a9a98]",
          isOpen && "border-[#0a0a0a] shadow-[0_0_0_3px_rgba(10,10,10,0.06)]"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-[#9a9a98]")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          strokeWidth={1.8}
          className={cn(
            "h-4 w-4 flex-shrink-0 text-[#9a9a98] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu - rendered via Portal */}
      {createPortal(dropdownPopup, document.body)}
    </div>
  )
}
