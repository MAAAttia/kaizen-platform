import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

const LANG_KEY = 'kaizen_lang';

function applyDir(lng) {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
}

// Apply direction immediately from saved preference before React mounts,
// preventing a flash of wrong-direction content.
const saved = localStorage.getItem(LANG_KEY) || 'en';
applyDir(saved);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: saved,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANG_KEY, lng);
  applyDir(lng);
});

export default i18n;
