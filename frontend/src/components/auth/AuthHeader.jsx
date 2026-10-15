import { Link, useNavigate } from 'react-router';
import { glow } from './authPresentation';
import logo from '../../../assets/img/logo.png';

// Visitor navbar on cadastro, preserving its original destinations.
export default function AuthHeader({ dark, rightSlot, children, activePath }) {
  const navigate = useNavigate();
  const menuLink = (path) =>
    activePath === undefined
      ? ''
      : `relative px-0.5 py-2.5 leading-none after:absolute after:bottom-0.5 after:left-0 after:h-[3px] after:rounded-full after:bg-workly-primary-glow after:content-[''] hover:text-[#0f9f54] hover:after:w-full dark:hover:text-workly-dark-accent ${activePath === path ? 'text-[#0f9f54] after:w-full dark:text-workly-dark-accent' : 'after:w-0'}`;
  function search(event) {
    event.preventDefault();
    const term = new FormData(event.currentTarget).get('search').trim();
    navigate(term ? `/todos-servicos?q=${encodeURIComponent(term)}` : '/todos-servicos');
  }
  return (
    <header className="relative z-[1000] w-full">
      <nav
        aria-label="Workly"
        className="flex min-h-[76px] items-center border-b border-[rgba(15,23,42,0.08)] bg-white/96 shadow-[0_10px_28px_rgba(15,23,42,0.06)] min-[1101px]:min-h-[83px] dark:border-[rgba(94,130,172,0.18)] dark:bg-[rgba(7,13,26,0.98)] dark:shadow-[0_12px_32px_rgba(0,4,18,0.30)] legacy-max-720:min-h-0"
      >
        <div className="mx-auto grid w-full max-w-[1520px] grid-cols-[160px_minmax(280px,560px)_1fr_auto] items-center gap-7 px-8 legacy-max-1100:grid-cols-[150px_1fr_auto] legacy-max-1100:gap-[18px] legacy-max-720:grid-cols-[1fr_auto] legacy-max-720:gap-3 legacy-max-720:px-4 legacy-max-720:py-[14px]">
          <Link
            to="/"
            aria-label="Workly"
            className="flex h-[76px] w-40 min-w-40 items-center legacy-max-720:h-11 legacy-max-720:w-auto legacy-max-720:min-w-0"
          >
            <img
              alt="Workly"
              src={logo}
              className={`block h-11 w-auto max-w-[150px] object-contain legacy-max-720:h-[38px] legacy-max-720:max-w-[132px] ${dark ? glow : ''}`}
            />
          </Link>
          <form
            onSubmit={search}
            className="relative flex h-[46px] w-full max-w-[560px] items-center legacy-max-720:order-3 legacy-max-720:col-span-full legacy-max-720:max-w-none"
          >
            <input
              name="search"
              aria-label="O que você está buscando?"
              placeholder="O que você está buscando?"
              className="h-[46px] w-full rounded-full border border-[rgba(148,163,184,0.35)] bg-white pr-12 pl-5 text-[0.95rem] leading-[normal] font-medium text-[#0f172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_24px_rgba(15,23,42,0.04)] outline-none placeholder:text-[#8ba0bc] focus:border-[rgba(15,206,106,0.55)] focus:shadow-[0_0_0_4px_rgba(15,206,106,0.12),0_12px_30px_rgba(15,23,42,0.07)] dark:border-[rgba(94,130,172,0.26)] dark:bg-[#0a1222] dark:text-workly-dark-text dark:placeholder:text-[#8fa3c1] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_10px_24px_rgba(0,0,0,0.20)]"
            />
            <button
              type="submit"
              title="Buscar"
              aria-label="Buscar"
              className="absolute top-[3px] right-1 flex h-10 w-10 items-center justify-center rounded-full text-[13.3333px] text-[#718096] hover:bg-[rgba(15,206,106,0.10)] hover:text-workly-primary-glow focus-visible:outline-2 focus-visible:outline-workly-primary"
            >
              <i aria-hidden="true" className="fas fa-search" />
            </button>
          </form>
          <div className="flex items-center justify-end gap-[30px] justify-self-end text-[0.95rem] font-bold text-[#0f172a] legacy-max-1100:hidden dark:text-workly-dark-text">
            <Link to="/" className={menuLink('/')}>
              Home
            </Link>
            <Link to="/sobre" className={menuLink('/sobre')}>
              Sobre Nós
            </Link>
          </div>
          {rightSlot || (
            <Link
              to="/login"
              className="inline-flex h-[42px] items-center justify-center rounded-full bg-workly-primary-glow px-5 font-extrabold text-white shadow-[0_14px_26px_rgba(15,206,106,0.22)] legacy-max-720:hidden"
            >
              Entrar
            </Link>
          )}
        </div>
      </nav>
      {children}
    </header>
  );
}
