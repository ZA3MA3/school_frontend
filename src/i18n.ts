import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import parentEn from './locales/parent/en.json';
import parentFr from './locales/parent/fr.json';
import teacherEn from './locales/teacher/en.json';
import teacherFr from './locales/teacher/fr.json';
import studentEn from './locales/student/en.json';
import studentFr from './locales/student/fr.json';
import loginEn from './locales/login/en.json';
import loginFr from './locales/login/fr.json';
import chatEn from './locales/chat/en.json';
import chatFr from './locales/chat/fr.json';
import notificationsEn from './locales/notifications/en.json';
import notificationsFr from './locales/notifications/fr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { 
        translation: {
          ...parentEn,
          teacher: teacherEn,
          student: studentEn,
          login: loginEn,
          chat: chatEn,
          notifications: notificationsEn
        } 
      },
      fr: { 
        translation: {
          ...parentFr,
          teacher: teacherFr,
          student: studentFr,
          login: loginFr,
          chat: chatFr,
          notifications: notificationsFr
        } 
      }
    },
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  })
  .then(() => {
    // Sync language to html lang attribute
    document.documentElement.lang = i18n.language;
    i18n.on('languageChanged', (lng) => {
      document.documentElement.lang = lng;
    });
  });

export default i18n;