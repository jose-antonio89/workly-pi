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
      labelClassName={`mb-2 block leading-[normal]! ${register ? 'text-[0.95rem] font-semibold legacy-max-576:text-sm' : recovery ? 'text-sm font-normal' : 'text-sm font-medium'} text-[#333] dark:text-workly-dark-text ${labelClassName}`}
      errorClassName="text-[0.83333rem] text-[#e74c3c] dark:text-workly-dark-text"
      className={`w-full min-w-0 border leading-[normal]! text-black placeholder:text-[#757575] ${register ? 'rounded border-[#e0e0e0] bg-white p-2.5 text-[13.3333px] focus:shadow-[0_0_0_2px_rgba(4,191,85,0.2)] legacy-max-576:p-2' : 'rounded-md border-[#dbdbdb] bg-[#f8f9fa] px-[15px] py-3 text-sm focus:shadow-[0_0_0_3px_#8fd9af]'} outline-none transition-[border-color,box-shadow] focus:border-workly-primary dark:border-[rgba(94,130,172,0.22)] dark:bg-[rgba(10,18,34,0.92)] dark:text-workly-dark-text dark:placeholder:text-[#93a6c3] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.025),inset_0_2px_6px_rgba(0,0,0,0.15)] dark:focus:border-[rgba(74,222,128,0.55)] dark:focus:shadow-[0_0_0_4px_rgba(74,222,128,0.12),0_10px_28px_rgba(74,222,128,0.07)] ${password && !visible ? 'pr-12!' : ''} ${error && props.as !== 'select' ? 'border-[#e74c3c]!' : valid && props.as !== 'select' ? 'border-workly-primary' : ''} ${className} ${recovery ? 'px-3!' : ''}`}
    >
      {icon && (
        <i aria-hidden="true" className={`fas ${icon} absolute right-3 bottom-3 text-[#9e9e9e]`} />
      )}
      {password && (
        <Button
          appearance="custom"
          title={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible(!visible)}
          className="absolute top-1/2 right-[14px] z-[3] -translate-y-[2px] rounded-[10px] border-0 bg-transparent p-1.5 text-[#6b7280] hover:bg-workly-primary/8 hover:text-workly-primary focus-visible:outline-2 focus-visible:outline-workly-primary dark:text-[#9db0c8] dark:hover:bg-[rgba(15,206,106,0.12)] dark:hover:text-[#86efac]"
        >
          <i aria-hidden="true" className={`fas ${visible ? 'fa-eye-slash' : 'fa-eye'}`} />
        </Button>
      )}
    </FormField>
  );
}
