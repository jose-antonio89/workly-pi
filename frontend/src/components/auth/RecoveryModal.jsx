import { useEffect, useRef } from 'react';
import Button from '../ui/Button';
import { EmptyState } from '../ui/Feedback';
import { submitStyles } from './authPresentation';

// UI only: the official backend has no recovery endpoint or mail integration.
export default function RecoveryModal({ onClose, opener }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => {
      element.close();
      opener.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="recovery-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
      className="m-auto w-full max-w-[400px] rounded-lg border-0 bg-workly-card p-[30px] text-center text-[#333] shadow-workly  backdrop:bg-black/50 dark:border dark:border-[rgba(170,180,172,0.18)] dark:bg-workly-night-raised dark:text-workly-dark-text"
    >
      <EmptyState>
        <h2 id="recovery-title" className="mb-[15px] text-[1.375rem] font-semibold text-workly-ink-warm">
          Recuperação de senha
        </h2>
        <p className="mb-[25px] text-sm text-[#777] dark:text-workly-dark-text">
          A recuperação por e-mail ainda não está disponível nesta versão. Se você está conectado,
          pode alterar sua senha nas configurações do perfil.
        </p>
      </EmptyState>
      <Button appearance="custom" type="button" onClick={onClose} className={submitStyles}>
        Voltar ao login
      </Button>
    </dialog>
  );
}
