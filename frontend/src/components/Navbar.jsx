import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-evergreen-light text-canvas' : 'text-canvas/70 hover:bg-evergreen-light/40 hover:text-canvas'
  }`;

function LangToggle() {
  const { i18n, t } = useTranslation();
  const toggle = () => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  return (
    <button
      onClick={toggle}
      title={t('lang.switchTo')}
      className="w-full flex items-center gap-2 px-4 py-2 rounded-md text-canvas/60 hover:text-canvas hover:bg-evergreen-light/30 text-sm font-medium transition-colors"
    >
      <span className="text-base">🌐</span>
      {t('lang.switchTo')}
    </button>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!user || user.status !== 'APPROVED') return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="w-60 shrink-0 bg-evergreen min-h-screen flex flex-col py-6 px-3">
      <div className="px-4 mb-8">
        <span className="font-display text-canvas text-xl font-semibold leading-none">{t('app.name')}</span>
        <span className="block text-canvas/60 text-xs mt-1">{t('app.tagline')}</span>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <NavLink to="/" className={linkClass} end>{t('nav.feed')}</NavLink>
        <NavLink to="/submit" className={linkClass}>{t('nav.submit')}</NavLink>
        <NavLink to="/my-ideas" className={linkClass}>{t('nav.myIdeas')}</NavLink>
        {user.role === 'ADMIN' && (
          <NavLink to="/admin" className={linkClass}>{t('nav.admin')}</NavLink>
        )}
      </div>

      <div className="px-4 border-t border-canvas/15 pt-4 mt-4 space-y-3">
        <LangToggle />
        <div>
          <p className="text-canvas text-sm font-medium truncate">{user.name}</p>
          <p className="text-canvas/50 text-xs truncate mb-2">{user.email}</p>
          <button onClick={handleLogout} className="text-canvas/70 hover:text-canvas text-sm font-medium">
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </nav>
  );
}
