import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import NotificationMenu from './NotificationMenu';
import Button from '../ui/Button';
import { limparSessao } from '../../services/authService';
import { defaultProfileImage } from '../../services/catalogService';

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  return (
    <div className="relative flex items-center gap-2.5 justify-self-end legacy-max-720:gap-2">
      <NotificationMenu />
      <div className="relative flex items-center" onClick={(event) => event.stopPropagation()}>
        <Button
          appearance="custom"
          id="profileBall"
          aria-label="Abrir menu do perfil"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="inline-flex h-12 text-[13.3333px] items-center justify-center gap-2.5 border-0 text-[#0f172a] focus-visible:outline-2 focus-visible:outline-workly-primary dark:text-[#eef5ff]"
        >
          <span className="max-w-[120px] truncate text-[0.96rem] leading-none font-extrabold legacy-max-720:hidden!">
            {String(user.nome || '').split(' ')[0]}
          </span>
          <img
            src={user.fotoPerfil || defaultProfileImage}
            alt="Perfil"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = defaultProfileImage;
            }}
            className="h-[46px] w-[46px] min-w-[46px] rounded-full border-[3px] border-white bg-workly-primary-glow object-cover shadow-[0_8px_22px_rgba(15,23,42,0.14)]"
          />
          <i
            aria-hidden="true"
            className={`fas fa-chevron-down text-[0.72rem] text-[#94a3b8] transition-transform legacy-max-720:hidden! ${open ? 'rotate-180' : ''}`}
          />
        </Button>
        {open && (
          <div
            id="dropdownMenu"
            className="absolute top-[calc(100%+12px)] right-0 z-[2000] w-[220px] rounded-[18px] border border-[rgba(148,163,184,0.22)] bg-white p-2.5 shadow-[0_24px_60px_rgba(15,23,42,0.16)] dark:border-[rgba(94,130,172,0.22)] dark:bg-[#0a1222] dark:shadow-[0_28px_72px_rgba(0,4,18,0.50)]"
          >
            {[
              ['/perfil', 'fa-user', 'Perfil'],
              ['/favoritos', 'fa-heart', 'Favoritos'],
              ['/contratos', 'fa-briefcase', 'Contratos'],
              ['/mensagens', 'fa-comments', 'Mensagens'],
              ['/anuncio', 'fa-plus-circle', 'Anunciar serviço'],
              ['#', 'fa-sign-out-alt', 'Sair']
            ].map(([href, icon, text]) => (
              <Link
                key={text}
                id={text === 'Sair' ? 'logoutBtn' : undefined}
                to={href}
                onClick={
                  text === 'Sair'
                    ? (event) => {
                        event.preventDefault();
                        limparSessao();
                        location.assign('/');
                      }
                    : () => setOpen(false)
                }
                className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.92rem] font-bold text-[#334155] hover:translate-x-0.5 hover:bg-workly-primary-glow/10 hover:text-[#0f9f54] dark:text-workly-dark-text dark:hover:bg-workly-dark-accent/[0.13] dark:hover:text-workly-dark-accent"
              >
                <i aria-hidden="true" className={`fas ${icon}`} />
                {text}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
