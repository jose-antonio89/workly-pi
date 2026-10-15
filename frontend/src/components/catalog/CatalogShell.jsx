import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import AuthShell from '../auth/AuthShell';
import AuthHeader from '../auth/AuthHeader';
import AuthFooter from '../auth/AuthFooter';
import SiteFooter from '../SiteFooter';
import { buscarUsuarioAtual, obterUsuario, obterToken } from '../../services/authService';
import UserMenu from './UserMenu';
import CategoryNavigation from './CategoryNavigation';

export default function CatalogShell({ title, children, footer = true, showCategories = true }) {
  const location = useLocation(),
    [user, setUser] = useState(() => (obterToken() ? obterUsuario() : null));
  const params = new URLSearchParams(location.search),
    active = params.get('id') || params.get('id_categoria');
  useEffect(() => {
    let mounted = true;
    buscarUsuarioAtual(false).then((value) => {
      if (mounted) setUser(value);
    });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    const clear = () => setUser(null);
    window.addEventListener('workly:session-expired', clear);
    return () => window.removeEventListener('workly:session-expired', clear);
  }, []);
  return (
    <AuthShell title={title}>
      {(dark) => (
        <>
          <AuthHeader
            dark={dark}
            activePath={location.pathname}
            rightSlot={user ? <UserMenu user={user} /> : undefined}
          >
            {showCategories && <CategoryNavigation active={active} />}
          </AuthHeader>
          {children}
          {footer === 'empty' ? (
            <SiteFooter />
          ) : (
            footer && (
              <AuthFooter
                catalog
                detail={location.pathname === '/detalhe-servico'}
                about={location.pathname === '/sobre'}
                compact={['/anuncio', '/editar-servico'].includes(location.pathname)}
              />
            )
          )}
        </>
      )}
    </AuthShell>
  );
}
