import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          tasks: {
            drop_here: 'DROP HERE',
            all: 'ALL',
            active: 'ACTIVE',
            done: 'DONE',
            all_categories: 'ALL CATEGORIES',
          },
          notes: {
            empty_note: 'Empty note'
          },
          dashboard: {
            add_circle: 'add_circle'
          }
        }
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
