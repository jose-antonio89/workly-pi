import { useState } from 'react';
import FormField from '../ui/FormField';
import Button from '../ui/Button';

export default function AuthField({
  variant = 'login',
  type = 'text',
  error,
  valid,
  icon,
  children,
  className = '',
  labelClassName = '',
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  const register = variant === 'register';
  const recovery = variant === 'recovery';
  return (
    <FormField
      {...props}
      controlChildren={children}
      error={error}
      type={password && visible ? 'text' : type}
      appearance="custom"
      wrapperClassName={`relative min-w-0 ${register ? 'mb-6' : 'mb-5'}`}
      labelClassName={`mb-2 block leading-[normal]! ${register ? 'text-[0.95rem] font-semibold legacy-max-576:text-sm' : recovery ? 'text-sm font-normal' : 'text-sm font-medium'} text-workly-ink-warm dark:text-workly-dark-text ${labelClassName}`}
      errorClassName="mt-1.5 text-[0.85rem] text-[#be123c] dark:text-[#fda4af]"
      className={`w-full min-w-0 rounded-md border border-workly-rule bg-workly-card px-[15px] py-3 text-[0.95rem] leading-[normal]! text-workly-ink-warm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-workly-muted-warm focus:border-workly-forest focus:shadow-[0_0_0_3px_rgba(14,59,44,0.14)] dark:border-white/15 dark:bg-workly-night dark:text-workly-dark-text dark:placeholder:text-[#9aa59f] dark:focus:border-workly-dark-accent ${password && !visible ? 'pr-12!' : ''} ${error && props.as !== 'select' ? 'border-[#be123c]!' : valid && props.as !== 'select' ? 'border-workly-primary-ink' : ''} ${className} ${recovery ? 'px-3!' : ''}`}
    >
      {icon && (
        <i aria-hidden="true" className={`fas ${icon} absolute right-3 bottom-3 text-workly-muted-warm`} />
      )}
      {password && (
        <Button
          appearance="custom"
          title={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible(!visible)}
          className="absolute top-1/2 right-[14px] z-[3] -translate-y-[2px] rounded-lg border-0 bg-transparent p-1.5 text-workly-muted-warm hover:bg-workly-primary/8 hover:text-workly-primary-ink focus-visible:outline-2 focus-visible:outline-workly-primary dark:text-[#9aa59f] dark:hover:bg-[rgba(4,191,85,0.12)] dark:hover:text-[#86efac]"
        >
          <i aria-hidden="true" className={`fas ${visible ? 'fa-eye-slash' : 'fa-eye'}`} />
        </Button>
      )}
    </FormField>
  );
}
