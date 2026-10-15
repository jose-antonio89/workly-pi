import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import Button from './Button';
import { EmptyState, ErrorState } from './Feedback';

export const moduleSurface =
  'overflow-hidden rounded-lg border border-workly-rule bg-workly-card dark:border-white/10 dark:bg-workly-night-raised';
export const moduleInput =
  'w-full min-w-0 rounded-md border border-workly-rule bg-workly-card px-3 py-2.5 text-workly-ink-warm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-workly-muted-warm focus:border-workly-forest focus:shadow-[0_0_0_3px_rgba(14,59,44,0.14)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-workly-night dark:text-[#ecebe5] dark:focus:border-workly-dark-accent';
const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-[18px] text-[0.95rem] font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-workly-out motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100';
export function ModuleButton({ to, tone = 'primary', className = '', children, ...props }) {
  const color =
    tone === 'primary'
      ? 'bg-workly-forest text-workly-on-forest hover:bg-workly-forest-raised dark:bg-workly-dark-accent dark:text-workly-night'
      : tone === 'danger'
        ? 'bg-[#fde8e8] text-[#9b1c1c] hover:bg-[#fbd5d5] dark:bg-[#fda4af]/15 dark:text-[#fda4af]'
        : 'border border-workly-rule bg-workly-card text-workly-ink-warm hover:border-workly-forest/40 dark:border-white/15 dark:bg-workly-night-raised dark:text-[#ecebe5]';
  return to ? (
    <Link to={to} className={`${buttonBase} ${color} ${className}`} {...props}>
      {children}
    </Link>
  ) : (
    <Button
      appearance="custom"
      className={`${buttonBase} ${color} ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}
export function ModulePage({
  children,
  kicker,
  title,
  description,
  heroRight,
  heroClassName = ''
}) {
  return (
    <main className="min-h-[70vh] bg-workly-paper pt-10 pb-20 text-workly-ink-warm dark:bg-workly-night dark:text-[#ecebe5]">
      <div className="mx-auto max-w-[1280px] px-10 legacy-max-720:px-6">
        {title && (
          <div
            className={`mb-8 flex items-end justify-between gap-[18px] border-b border-workly-rule pb-6 dark:border-white/10 legacy-max-920:flex-col legacy-max-920:items-stretch ${heroClassName}`}
          >
            <div>
              {kicker && (
                <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-workly-primary-ink uppercase dark:text-workly-dark-accent">
                  {kicker}
                </p>
              )}
              <h1 className="mb-2 max-w-[680px] font-workly-display text-[clamp(1.875rem,3.4vw,2.625rem)] leading-[1.04] font-semibold tracking-[-0.025em] text-balance [font-variation-settings:'opsz'_96]">
                {title}
              </h1>
              <p className="max-w-[680px] leading-[1.7] text-workly-muted-warm dark:text-[#9aa59f]">
                {description}
              </p>
            </div>
            {heroRight}
          </div>
        )}
        {children}
      </div>
    </main>
  );
}
export function ModuleEmpty({ title, message, icon = 'fa-briefcase', error = false, children }) {
  const Component = error ? ErrorState : EmptyState;
  return (
    <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-workly-rule bg-workly-card/60 px-6 py-12 text-center text-workly-muted-warm dark:border-white/15 dark:bg-workly-night-raised dark:text-[#9aa59f]">
      <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-workly-primary-tint text-lg text-workly-forest dark:bg-workly-dark-accent/10 dark:text-workly-dark-accent">
        <i className={`fas ${icon}`} />
      </span>
      <Component>
        <h3 className="text-lg font-semibold text-workly-ink-warm dark:text-[#ecebe5]">{title}</h3>
        <p>{message}</p>
      </Component>
      {children}
    </div>
  );
}
export function useModuleToast(duration = 2200) {
  const [message, setMessage] = useState(''),
    timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [
    message,
    (text) => {
      clearTimeout(timer.current);
      setMessage(text);
      timer.current = setTimeout(() => setMessage(''), duration);
    }
  ];
}
export function ModuleToast({ message }) {
  return message ? (
    <div
      role="status"
      className="fixed right-6 bottom-6 z-[99999] max-w-[calc(100vw-48px)] rounded-lg bg-[#16211b] px-[18px] py-3.5 text-white shadow-[0_1px_2px_rgba(22,33,27,0.05)]"
    >
      {message}
    </div>
  ) : null;
}
