import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
      <button
        onClick={() => setLanguage('ru')}
        className={cn(
          "px-2.5 py-1.5 text-xs font-medium rounded-md transition-all",
          language === 'ru'
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        RU
      </button>
      <button
        onClick={() => setLanguage('th')}
        className={cn(
          "px-2.5 py-1.5 text-xs font-medium rounded-md transition-all",
          language === 'th'
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        TH
      </button>
    </div>
  )
}
