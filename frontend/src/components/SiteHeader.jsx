import { Link } from 'react-router';
import logo from '../../assets/img/logo.png';

export default function SiteHeader({ dark = localStorage.getItem('darkMode') === 'enabled' }) {
  return (
    <header className="border-b border-workly-border bg-workly-surface dark:border-white/10 dark:bg-workly-dark-surface">
      <nav
        className="mx-auto flex min-h-[76px] w-full max-w-[1180px] items-center px-5 sm:px-8"
        aria-label="Workly"
      >
        <Link to="/" aria-label="Workly">
          <img
            src={logo}
            alt="Workly"
            className={`h-11 w-auto max-w-[150px] object-contain ${dark ? '[filter:drop-shadow(0_0_3px_rgba(0,255,123,0.95))_drop-shadow(0_0_8px_rgba(0,255,123,0.72))_drop-shadow(0_0_16px_rgba(0,255,123,0.48))_drop-shadow(0_0_28px_rgba(0,255,123,0.28))] hover:[filter:drop-shadow(0_0_4px_rgba(0,255,123,1))_drop-shadow(0_0_11px_rgba(0,255,123,0.82))_drop-shadow(0_0_22px_rgba(0,255,123,0.55))_drop-shadow(0_0_36px_rgba(0,255,123,0.32))]' : ''}`}
          />
        </Link>
      </nav>
    </header>
  );
}
