import { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import AuthShell from '../components/auth/AuthShell';
import AuthField from '../components/auth/AuthField';
import { glow, linkStyles, showAuthAlert, submitStyles } from '../components/auth/authPresentation';
import Button from '../components/ui/Button';
import { ErrorState, LoadingState } from '../components/ui/Feedback';
import { login, salvarSessao } from '../services/authService';
import logo from '../../assets/img/logo.png';
import darkLogo from '../../assets/img/logo-dark.png';
import RecoveryModal from '../components/auth/RecoveryModal';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recovery, setRecovery] = useState(false);
  const recoveryLink = useRef(null);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const result = await login({ email: form.get('email').trim(), senha: form.get('senha') });
      salvarSessao(result);
      await showAuthAlert({
        icon: 'success',
        title: 'Login realizado!',
        text: result.mensagem,
        confirmText: 'Continuar'
      });
      const destination = location.state?.from;
      navigate(
        typeof destination === 'string' &&
          destination.startsWith('/') &&
          !destination.startsWith('//') &&
          !/^\/(login|cadastro)(?:[/?#]|$)/.test(destination)
          ? destination
          : '/',
        { replace: true }
      );
    } catch (err) {
      const text = err.message || 'Não foi possível entrar na sua conta.';
      setError(text);
      await showAuthAlert({ icon: 'error', title: 'Erro no login', text, confirmText: 'Fechar' });
      setError('');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthShell login>
      {(dark) => (
        <div className="mx-auto w-[400px] max-w-full overflow-hidden rounded-[10px] bg-white shadow-workly backdrop-blur-[14px] dark:border dark:border-[rgba(94,130,172,0.18)] dark:bg-[linear-gradient(160deg,rgba(14,25,42,0.94),rgba(12,20,36,0.90))] dark:shadow-[0_22px_64px_rgba(0,4,18,0.42),inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="relative bg-workly-primary px-5 py-[25px] text-center text-white">
            <span className="mb-[15px] flex w-full justify-center">
              <img
                alt="Workly"
                src={dark ? darkLogo : logo}
                className={`mx-auto block max-w-[150px] ${dark ? glow : ''}`}
              />
            </span>
            <h1 className="mb-[5px] text-2xl leading-[normal] font-semibold dark:text-workly-dark-text">
              Bem-vindo ao Workly
            </h1>
            <p className="text-sm leading-[normal] opacity-90 dark:text-workly-dark-text">
              Faça login para continuar
            </p>
          </div>
          <form id="formLogin" onSubmit={submit} className="p-[30px]" aria-busy={busy}>
            <AuthField
              id="email"
              name="email"
              label="Email*"
              placeholder="Digite seu email"
              required
              icon="fa-user"
            />
            <AuthField
              id="senha"
              name="senha"
              label="Senha*"
              type="password"
              placeholder="Digite sua senha"
              required
              minLength={8}
            />
            <div className="mb-5 text-right">
              <a
                ref={recoveryLink}
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  setRecovery(true);
                }}
                className={`${linkStyles} text-[13px] leading-[normal]`}
              >
                Esqueceu a senha?
              </a>
            </div>
            <Button appearance="custom" type="submit" className={submitStyles}>
              Entrar
            </Button>
            {busy && <LoadingState inline message="Entrar" className="sr-only" />}
            {error && <ErrorState className="sr-only">{error}</ErrorState>}
            <div className="mt-5 text-center text-sm leading-[normal] text-[#777] dark:text-workly-dark-text">
              Não tem uma conta?{' '}
              <Link to="/cadastro" className={`${linkStyles} font-semibold`}>
                Cadastre-se
              </Link>
            </div>
            <div className="mt-[25px] text-center">
              <p className="relative mb-[15px] text-[13px] leading-[normal] text-[#777] before:absolute before:top-1/2 before:left-0 before:h-px before:w-[30%] before:bg-[#dbdbdb] after:absolute after:top-1/2 after:right-0 after:h-px after:w-[30%] after:bg-[#dbdbdb] dark:text-workly-dark-text">
                Ou entre com
              </p>
              <div className="flex items-center justify-center gap-[14px]">
                {[
                  ['google', 'Google'],
                  ['facebook-f', 'Facebook'],
                  ['apple', 'Apple']
                ].map(([icon, label]) => (
                  <a
                    key={icon}
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      void showAuthAlert({
                        icon: 'info',
                        title: 'Login social indisponível',
                        text: 'Nesta versão, entre com seu e-mail e senha.'
                      });
                    }}
                    aria-label={label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(148,163,184,0.14)] bg-[#e9eef5] text-[#64748b] hover:-translate-y-1 hover:bg-workly-primary hover:text-white dark:bg-[rgba(148,163,184,0.12)] dark:text-[#dbeafe]"
                  >
                    <i aria-hidden="true" className={`fab fa-${icon}`} />
                  </a>
                ))}
              </div>
            </div>
          </form>
          {recovery && <RecoveryModal opener={recoveryLink} onClose={() => setRecovery(false)} />}
        </div>
      )}
    </AuthShell>
  );
}
