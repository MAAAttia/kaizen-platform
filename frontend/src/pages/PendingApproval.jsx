import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PendingApproval() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-spark/15 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#D97B29" strokeWidth="2" />
            <path d="M12 7v5l3 3" stroke="#D97B29" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">{t('pending.title')}</h1>
        <p className="text-slate-500 text-sm mb-6">{t('pending.body')}</p>
        <Link to="/login" className="text-evergreen font-medium hover:underline text-sm">
          {t('pending.back')}
        </Link>
      </div>
    </div>
  );
}
