import { useEffect, useState } from 'react';
import Button from '../ui/Button';

export default function AuthShell({ children, login = false, title }) {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'enabled');
  useEffect(() => {
    document.title = title || (login ? 'Workly - Login' : 'Workly - Cadastro');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    return () => {
      document.documentElement.style.colorScheme = '';
    };
  }, [dark, login, title]);
  return (
    <div
      data-workly-theme={dark ? 'dark' : 'light'}
      className={`min-h-screen bg-[radial-gradient(ellipse_at_10%_0%,rgba(4,191,85,0.10),transparent_32%),radial-gradient(ellipse_at_90%_0%,rgba(33,150,243,0.08),transparent_28%),linear-gradient(180deg,#f3f7fc_0%,#ebf1f9_100%)] font-workly leading-[normal] tracking-[0] text-workly-text selection:bg-workly-primary selection:text-white dark:bg-[radial-gradient(ellipse_at_8%_0%,rgba(15,206,106,0.14),transparent_26%),radial-gradient(ellipse_at_92%_0%,rgba(56,130,246,0.10),transparent_22%),linear-gradient(180deg,#060d1b_0%,#0a1422_48%,#0d1a2e_100%)] dark:text-workly-dark-text ${login ? 'flex items-center justify-center p-6' : ''}`}
    >
      {typeof children === 'function' ? children(dark) : children}
      <Button
        appearance="custom"
        title={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        onClick={() => {
          localStorage.setItem('darkMode', dark ? 'disabled' : 'enabled');
          setDark(!dark);
        }}
        className="fixed right-[22px] bottom-[22px] z-[9999] inline-flex h-[54px] w-[54px] items-center justify-center rounded-full border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(135deg,#ffffff,#e8eef8)] text-[#0f172a] shadow-[0_16px_40px_rgba(15,23,42,0.15)] backdrop-blur-[16px] transition-transform hover:-translate-y-[3px] hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-workly-primary legacy-max-768:right-[14px] legacy-max-768:bottom-[14px] legacy-max-768:h-12 legacy-max-768:w-12 dark:border-white/10 dark:bg-[linear-gradient(135deg,#0fce6a,#0aa85a)] dark:text-workly-dark-text dark:shadow-[0_14px_32px_rgba(15,206,106,0.28),0_0_0_1px_rgba(15,206,106,0.12)]"
      >
        <i aria-hidden="true" className={`fas ${dark ? 'fa-sun' : 'fa-moon'} text-[1.1rem]`} />
      </Button>
    </div>
  );
}
