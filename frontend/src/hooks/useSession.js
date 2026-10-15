import { useEffect, useState } from 'react';
import { buscarUsuarioAtual, obterToken } from '../services/authService.js';

export default function useSession() {
  const [status, setStatus] = useState(() => (obterToken() ? 'loading' : 'guest'));
  useEffect(() => {
    let active = true;
    const expired = () => {
      if (active) setStatus('guest');
    };
    window.addEventListener('workly:session-expired', expired);
    if (obterToken()) {
      buscarUsuarioAtual(true).then((user) => {
        if (active) setStatus(!obterToken() ? 'guest' : user ? 'authenticated' : 'error');
      });
    }
    return () => {
      active = false;
      window.removeEventListener('workly:session-expired', expired);
    };
  }, []);
  return status;
}
