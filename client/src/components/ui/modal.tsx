import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { type ReactNode, useEffect } from "react"
import { createPortal } from "react-dom"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, className, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  // Portal into document.body so the modal escapes any ancestor stacking
  // context / `transform` containing block (e.g. `.page-enter`, `.stagger-animation`).
  // Without the portal, `position: fixed` here would be contained by those
  // transformed ancestors and the backdrop would only cover the page area
  // instead of the whole viewport.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0a0a0a]/55 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "scroll-refined relative z-[101] w-full max-h-[90vh] overflow-y-auto bg-white rounded-[20px] border border-[#ebe9e3]",
          "shadow-[0_24px_60px_-12px_rgba(10,10,10,0.25),0_8px_24px_-8px_rgba(10,10,10,0.15)] p-6 animate-scaleIn",
          sizeClasses[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#ebe9e3]">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-[#0a0a0a]">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="btn-press w-9 h-9 -mr-1.5 flex items-center justify-center rounded-[10px] text-[#6b6b6b] hover:text-[#0a0a0a] hover:bg-[#faf9f5] transition-colors"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
