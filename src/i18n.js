import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'es',
    fallbackLng: 'en',
    ns: ['bussinesses', 'clients', 'conversations', 'formats', 'knowledge', 'login', 'main', , 'settings', 'stats'],
    defaultNS: 'main',
    backend: {
      backend: {
        loadPath: `${window.location.origin}/locales/{{lng}}/{{ns}}.json`,
      },
          },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
