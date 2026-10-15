import { useId } from 'react';

// Login geometry only; other screen variants remain with their migration.
export default function FormField({
  id,
  label,
  error,
  className = '',
  appearance = 'default',
  wrapperClassName,
  labelClassName,
  errorClassName,
  controlChildren,
  children,
  as: Control = 'input',
  ...props
}) {
  const generatedId = useId();
  const controlId = id || generatedId;
  const content = controlChildren ?? (Control === 'input' ? undefined : children);
  const description =
    [props['aria-describedby'], error ? `${controlId}-error` : null].filter(Boolean).join(' ') ||
    undefined;
  return (
    <div className={wrapperClassName || 'mb-5 min-w-0'}>
      <label htmlFor={controlId} className={labelClassName || 'mb-2 block text-sm font-medium'}>
        {label}
      </label>
      <Control
        {...props}
        id={controlId}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={description}
        className={`${appearance === 'custom' ? '' : 'w-full min-w-0 rounded-md border border-[#dbdbdb] bg-[#f8f9fa] px-[15px] py-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-workly-primary focus:shadow-[0_0_0_3px_#8fd9af] dark:border-[rgba(94,130,172,0.22)] dark:bg-[rgba(10,18,34,0.92)] dark:text-workly-dark-text dark:focus:border-[rgba(74,222,128,0.55)] dark:focus:shadow-[0_0_0_4px_rgba(74,222,128,0.12),0_10px_28px_rgba(74,222,128,0.07)]'} ${className}`}
      >
        {content}
      </Control>
      {(Control === 'input' || controlChildren !== undefined) && children}
      {error && (
        <p id={`${controlId}-error`} role="alert" className={errorClassName || 'mt-2 text-sm'}>
          {error}
        </p>
      )}
    </div>
  );
}
