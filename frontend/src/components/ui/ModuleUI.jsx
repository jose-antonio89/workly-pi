import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import Button from './Button';
import { EmptyState, ErrorState } from './Feedback';

export const moduleSurface =
  'overflow-hidden rounded-[24px] border border-[#e2e8f0]/80 bg-white/94 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-[#94a3b8]/16 dark:bg-[#0f172a]/92';
export const moduleInput =
  'w-full min-w-0 rounded-xl border border-[#dbe4ef] bg-white px-3 py-2.5 outline-none focus:border-workly-primary focus:shadow-[0_0_0_4px_rgba(4,191,85,0.12)] dark:border-[#94a3b8]/20 dark:bg-[#0b1424] dark:text-[#f8fafc]';
const buttonBase =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] px-[18px] py-3 font-extrabold transition hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-workly-primary disabled:opacity-60';
export function ModuleButton({ to, tone = 'primary', className = '', children, ...props }) {
  const color =
    tone === 'primary'
      ? 'bg-workly-primary text-white shadow-[0_14px_26px_rgba(4,191,85,0.20)]'
      : tone === 'danger'
        ? 'bg-[#fff1f2] text-[#e11d48]'
        : 'border border-[#dbe4ef] bg-white text-[#101827] dark:border-[#2d3b52] dark:bg-[#111c2f] dark:text-[#eef5ff]';
  return to ? (
    <Link to={to} className={`${buttonBase} ${color} ${className}`} {...props}>
      {children}
    </Link>
  ) : (
    <Button
      appearance="custom"
      style={{ fontSize: '13.3333px' }}
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
    <main className="min-h-[70vh] bg-[linear-gradient(135deg,#f5f9fc,#eef9f2)] pt-[42px] pb-[70px] text-[#101827] dark:bg-[linear-gradient(135deg,#07111f,#0d1a2b)] dark:text-[#eef5ff]">
      <div className="mx-auto max-w-[1180px] px-6">
        {title && (
          <div
            className={`mb-7 flex items-center justify-between gap-[18px] legacy-max-920:flex-col legacy-max-920:items-stretch ${heroClassName}`}
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-workly-primary/12 px-3.5 py-2 text-[0.9rem] font-extrabold text-[#029d47]">
                {kicker}
              </span>
              <h1
                style={{ fontWeight: 700 }}
                className="max-w-[680px] mt-4 mb-2 text-[3.4rem] leading-none legacy-max-800:text-[2rem]"
              >
                {title}
              </h1>
              <p className="max-w-[680px] leading-[1.7] text-[#64748b] dark:text-[#aebbd0]">
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
    <div className="rounded-[24px] border border-dashed border-[#cbd5e1] bg-white/90 p-[42px] text-center text-[#64748b] dark:border-[#94a3b8]/20 dark:bg-[#0f172a]/92 dark:text-[#aebbd0]">
      <i aria-hidden="true" className={`fas ${icon} mb-3 text-[2.3rem] text-workly-primary`} />
      <Component>
        <h3 className="font-bold">{title}</h3>
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
      className="fixed right-6 bottom-6 z-[99999] max-w-[calc(100vw-48px)] rounded-2xl bg-[#101827] px-[18px] py-3.5 text-white shadow-[0_14px_30px_rgba(0,0,0,0.25)]"
    >
      {message}
    </div>
  ) : null;
}
