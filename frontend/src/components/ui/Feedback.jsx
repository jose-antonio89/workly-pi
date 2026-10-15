export function LoadingState({
  message = 'Carregando dados da Workly...',
  detail = 'Preparando as informações para você.',
  inline = false,
  className = ''
}) {
  if (inline)
    return (
      <span role="status" aria-live="polite" className={className}>
        {message}
      </span>
    );
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mx-auto my-5 grid w-full max-w-[460px] place-items-center gap-2.5 rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-white/78 px-[26px] py-[30px] text-center text-[#0f172a] shadow-[0_18px_44px_rgba(15,23,42,0.08)] dark:border-[rgba(94,130,172,0.18)] dark:bg-[linear-gradient(160deg,rgba(14,25,42,0.94),rgba(10,18,34,0.88))] dark:text-workly-dark-text ${className}`}
    >
      <span
        aria-hidden="true"
        className="h-[42px] w-[42px] animate-workly-spin rounded-full border-4 border-[rgba(4,191,85,0.16)] border-t-workly-primary motion-reduce:animate-none"
      />
      <strong>{message}</strong>
      {detail && <small className="text-[#64748b] dark:text-[#9fb0c7]">{detail}</small>}
    </div>
  );
}

// Domain copy and page-specific presentation belong to the caller.
export function ErrorState({ children, className = '' }) {
  return (
    <div role="alert" className={`min-w-0 ${className}`}>
      {children}
    </div>
  );
}
export function EmptyState({ children, className = '' }) {
  return (
    <div role="status" className={`min-w-0 ${className}`}>
      {children}
    </div>
  );
}
