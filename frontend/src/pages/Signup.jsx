import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client.js';

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

export default function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', departmentId: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/departments').then(({ data }) => setDepartments(data.departments)).catch(() => {});
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await client.post('/auth/signup', form);
      navigate('/pending');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-canvas px-4">
      <LangToggle />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink">{t('auth.signupTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('auth.signupSubtitle')}</p>
        </div>

        <form onSubmit={submit} className="bg-white border border-mist rounded-card p-6 space-y-4">
          {error && (
            <p className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('auth.fullName')}</label>
            <input required value={form.name} onChange={update('name')}
              className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('auth.dept')}</label>
            <select value={form.departmentId} onChange={update('departmentId')}
              className="w-full rounded-md border border-mist px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-evergreen/30">
              <option value="">{t('auth.selectDept')}</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('auth.workEmail')}</label>
            <input type="email" required value={form.email} onChange={update('email')}
              className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('auth.password')}</label>
            <input type="password" required minLength={8} value={form.password} onChange={update('password')}
              className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30" />
            <p className="text-xs text-slate-500 mt-1">{t('auth.passwordHint')}</p>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-evergreen text-canvas font-medium rounded-md py-2.5 hover:bg-evergreen-dark disabled:opacity-50">
            {submitting ? t('auth.requesting') : t('auth.requestAccess')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-evergreen font-medium hover:underline">{t('auth.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
