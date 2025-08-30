'use client';

import { useEffect, useState } from 'react';
import i18n from '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Get language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
    if (savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }

    // Listen for language change events
    const handleLanguageChange = (event: CustomEvent) => {
      const newLanguage = event.detail;
      if (newLanguage !== i18n.language) {
        i18n.changeLanguage(newLanguage);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
