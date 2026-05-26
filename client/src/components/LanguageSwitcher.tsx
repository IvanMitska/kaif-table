import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="segment">
      <button
        onClick={() => setLanguage('ru')}
        className={cn(
          'segment-item btn-press',
          language === 'ru' && 'segment-item-active bg-[#0a0a0a]'
        )}
      >
        RU
      </button>
      <button
        onClick={() => setLanguage('th')}
        className={cn(
          'segment-item btn-press',
          language === 'th' && 'segment-item-active bg-[#0a0a0a]'
        )}
      >
        TH
      </button>
    </div>
  )
}
