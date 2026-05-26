import { cn } from "@/lib/utils"
import {
  addMonths,
  format,
  getDaysInMonth,
  getDay,
  startOfMonth,
  subMonths,
  isSameDay,
  isToday,
  parse,
} from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

interface DatePickerProps {
  value: string // format: yyyy-MM-dd
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

export function DatePicker({
  value,
  onChange,
  placeholder = "Выберите дату",
  className,
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      return parse(value, "yyyy-MM-dd", new Date())
    }
    return new Date()
  })
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null

  // Calculate popup position
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const popupHeight = 340 // approximate height of calendar
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
      })
    }
  }, [isOpen])

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

  // Update view date when value changes
  useEffect(() => {
    if (value) {
      setViewDate(parse(value, "yyyy-MM-dd", new Date()))
    }
  }, [value])

  const daysInMonth = getDaysInMonth(viewDate)
  const firstDayOfMonth = startOfMonth(viewDate)
  // getDay returns 0 for Sunday, we need Monday as first day
  const startDayIndex = (getDay(firstDayOfMonth) + 6) % 7

  const days: (number | null)[] = []
  // Add empty cells for days before the first of the month
  for (let i = 0; i < startDayIndex; i++) {
    days.push(null)
  }
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const handleSelectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    onChange(format(newDate, "yyyy-MM-dd"))
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setViewDate(subMonths(viewDate, 1))
  }

  const handleNextMonth = () => {
    setViewDate(addMonths(viewDate, 1))
  }

  const handleToday = () => {
    const today = new Date()
    setViewDate(today)
    onChange(format(today, "yyyy-MM-dd"))
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange("")
    setIsOpen(false)
  }

  const calendarPopup = isOpen ? (
    <div
      ref={popupRef}
      className="fixed z-[9999] animate-dropdownIn"
      style={{
        top: popupPosition.top,
        left: popupPosition.left,
      }}
    >
      <div className="rounded-[16px] border border-[#ebe9e3] bg-white p-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-[284px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="btn-press p-1.5 hover:bg-[#faf9f5] rounded-[10px]"
          >
            <ChevronLeft className="h-4 w-4 text-[#6b6b6b]" strokeWidth={1.8} />
          </button>
          <span className="text-[13.5px] font-semibold text-[#0a0a0a] capitalize">
            {format(viewDate, "LLLL yyyy", { locale: ru })}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="btn-press p-1.5 hover:bg-[#faf9f5] rounded-[10px]"
          >
            <ChevronRight className="h-4 w-4 text-[#6b6b6b]" strokeWidth={1.8} />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-[11px] font-medium text-[#9a9a98]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-8" />
            }

            const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isTodayDate = isToday(date)

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDate(day)}
                className={cn(
                  "h-8 w-8 flex items-center justify-center text-[13px] rounded-[9px] transition-all duration-150",
                  "hover:bg-[#faf9f5]",
                  isSelected && "bg-[#0a0a0a] text-white hover:bg-[#262626]",
                  !isSelected && isTodayDate && "ring-1 ring-inset ring-[#0a0a0a] text-[#0a0a0a] font-semibold",
                  !isSelected && !isTodayDate && "text-[#1f1f1f]"
                )}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#ebe9e3]">
          <button
            type="button"
            onClick={handleClear}
            className="text-[12px] text-[#9a9a98] hover:text-[#6b6b6b] transition-colors"
          >
            Очистить
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="text-[12px] text-[#0a0a0a] font-medium hover:opacity-70 transition-opacity"
          >
            Сегодня
          </button>
        </div>
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
          "flex h-10 w-full items-center gap-2 rounded-[12px] border border-[#ebe9e3] bg-white px-3 text-[13.5px] text-[#1f1f1f]",
          "transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "hover:border-[#e0ddd4] focus:outline-none focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]",
          disabled && "cursor-not-allowed bg-[#faf9f5] text-[#9a9a98]",
          isOpen && "border-[#0a0a0a] shadow-[0_0_0_3px_rgba(10,10,10,0.06)]"
        )}
      >
        <Calendar className="h-4 w-4 text-[#9a9a98] flex-shrink-0" strokeWidth={1.8} />
        <span className={cn("flex-1 text-left", !value && "text-[#9a9a98]")}>
          {value ? format(parse(value, "yyyy-MM-dd", new Date()), "dd.MM.yyyy") : placeholder}
        </span>
      </button>

      {/* Calendar Popup - rendered via Portal */}
      {createPortal(calendarPopup, document.body)}
    </div>
  )
}
