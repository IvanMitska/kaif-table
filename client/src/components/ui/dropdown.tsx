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
      const popupHeight = Math.min(options.length * 44 + 12, 300) // approximate height
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      let top: number
      if (spaceBelow >= popupHeight || spaceBelow >= spaceAbove) {
        // Show below
        top = rect.bottom + 4
      } else {
        // Show above
        top = rect.top - popupHeight - 4
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
      <div className="rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10 max-h-[300px] overflow-auto">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value)
              setIsOpen(false)
            }}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors",
              "hover:bg-slate-50",
              option.value === value
                ? "text-primary font-medium bg-primary/5"
                : "text-slate-700"
            )}
          >
            <span className="w-4 flex-shrink-0">
              {option.value === value && (
                <Check className="h-4 w-4 text-primary" />
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
          "flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all",
          "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
          isOpen && "border-primary ring-2 ring-primary/30"
        )}
      >
        <span className={cn(!selectedOption && "text-slate-400")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu - rendered via Portal */}
      {createPortal(dropdownPopup, document.body)}
    </div>
  )
}
