import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from '../../public/locales/en/common.json';
import amCommon from '../../public/locales/am/common.json';
import haCommon from '../../public/locales/ha/common.json';
import omCommon from '../../public/locales/om/common.json';

const resources = {
  en: {
    common: enCommon,
  },
  am: {
    common: amCommon,
  },
  ha: {
    common: haCommon,
  },
  om: {
    common: omCommon,
  },
};

// Only initialize if not already initialized
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en', // default language
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      
      defaultNS: 'common',
      ns: ['common'],
      
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
