module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'am', 'ha', 'om'],
    localeNames: {
      en: 'English',
      am: 'Amharic',
      ha: 'Harari',
      om: 'Oromo'
    }
  },
  localePath: './public/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}
