import { Globe } from 'lucide-react'
import type { Language } from '~source/shared/types/settings'
import { LANGUAGES } from '~source/shared/types/settings'

interface LanguageSettingsProps {
  currentLanguage: Language
  onLanguageChange: (language: Language) => void
}

export function LanguageSettings({ currentLanguage, onLanguageChange }: LanguageSettingsProps) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="text-gray-700" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">界面语言</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(LANGUAGES).map(([lang, label]) => (
          <button
            key={lang}
            onClick={() => onLanguageChange(lang as Language)}
            className={`
              flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all duration-200
              ${currentLanguage === lang
              ? 'border-theme-primary-500 bg-theme-primary-50 text-theme-primary-700 font-medium'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-gray-600">
        更改语言后将自动应用到整个扩展界面
      </p>
    </div>
  )
}
