import { Link } from 'react-router';

const styles =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-workly-primary px-6 py-3 text-base font-semibold text-white hover:bg-workly-primary-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-workly-primary';

export default function Button({
  to,
  className = '',
  appearance = 'default',
  disabled = false,
  type = 'button',
  children,
  ...props
}) {
  const base = appearance === 'custom' ? '' : styles;
  if (to !== undefined)
    return (
      <Link {...props} to={to} className={`${base} ${className}`}>
        {children}
      </Link>
    );
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      className={`${base} disabled:cursor-not-allowed ${appearance === 'default' ? 'disabled:opacity-60' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
