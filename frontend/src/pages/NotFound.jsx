import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">{t('notFound.title')}</h1>
        <p className="text-slate-500 text-sm mb-4">{t('notFound.body')}</p>
        <Link to="/" className="text-evergreen font-medium hover:underline">{t('notFound.back')}</Link>
      </div>
    </div>
  );
}
