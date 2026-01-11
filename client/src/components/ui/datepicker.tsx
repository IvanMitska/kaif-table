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
        top = rect.bottom + 4
      } else {
        // Show above
        top = rect.top - popupHeight - 4
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
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 w-[280px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </button>
          <span className="text-sm font-semibold text-slate-900 capitalize">
            {format(viewDate, "LLLL yyyy", { locale: ru })}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-xs font-medium text-slate-400"
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
                  "h-8 w-8 flex items-center justify-center text-sm rounded-lg transition-all",
                  "hover:bg-slate-100",
                  isSelected && "bg-primary text-white hover:bg-primary/90",
                  !isSelected && isTodayDate && "bg-primary/10 text-primary font-semibold",
                  !isSelected && !isTodayDate && "text-slate-700"
                )}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Очистить
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="text-xs text-primary font-medium hover:text-primary/80 transition-colors"
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
          "flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all",
          "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
          isOpen && "border-primary ring-2 ring-primary/30"
        )}
      >
        <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <span className={cn("flex-1 text-left", !value && "text-slate-400")}>
          {value ? format(parse(value, "yyyy-MM-dd", new Date()), "dd.MM.yyyy") : placeholder}
        </span>
      </button>

      {/* Calendar Popup - rendered via Portal */}
      {createPortal(calendarPopup, document.body)}
    </div>
  )
}
