'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ha', name: 'Harari', nativeName: 'ሐረሪ' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' }
];

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons';
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  className = ''
}) => {
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = languages.find(lang => lang.code === (i18n.language || 'en')) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
    localStorage.setItem('i18nextLng', languageCode);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: languageCode }));
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              i18n.language === language.code
                ? 'bg-[#0ea371] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            title={language.name}
          >
            {language.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguage.nativeName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50 dark:bg-gray-800 dark:border-gray-600">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                i18n.language === language.code
                  ? 'bg-[#0ea371] text-white hover:bg-[#0ea371]'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{language.nativeName}</span>
                <span className="text-xs opacity-75">{language.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
