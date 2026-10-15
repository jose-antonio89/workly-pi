import { Link } from 'react-router';
import logo from '../../assets/img/logo.png';

export default function SiteHeader({ dark = localStorage.getItem('darkMode') === 'enabled' }) {
  return (
    <header className="border-b border-workly-rule bg-workly-paper dark:border-white/10 dark:bg-workly-night">
      <nav
        className="mx-auto flex min-h-[76px] w-full max-w-[1280px] items-center px-10 legacy-max-720:px-6"
        aria-label="Workly"
      >
        <Link to="/" aria-label="Workly - página inicial">
          <img
            src={logo}
            alt="Workly"
            className={`h-11 w-auto max-w-[150px] object-contain ${dark ? '[filter:invert(1)_hue-rotate(180deg)]' : ''}`}
          />
        </Link>
      </nav>
    </header>
  );
}
