import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

function LangToggle() {
  const { i18n, t } = useTranslation();
  return (
    <button
      onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
      className="absolute top-4 end-4 text-sm font-medium text-slate-500 hover:text-ink px-3 py-1.5 border border-mist rounded-md bg-white"
    >
      🌐 {t('lang.switchTo')}
    </button>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const dest = location.state?.from || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.status === 'PENDING') navigate('/pending');
      else setError(data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-canvas px-4">
      <LangToggle />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink">{t('auth.loginTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={submit} className="bg-white border border-mist rounded-card p-6 space-y-4">
          {error && (
            <p className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('auth.email')}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('auth.password')}</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-evergreen text-canvas font-medium rounded-md py-2.5 hover:bg-evergreen-dark disabled:opacity-50">
            {submitting ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="text-evergreen font-medium hover:underline">{t('auth.createAccount')}</Link>
        </p>
      </div>
    </div>
  );
}
