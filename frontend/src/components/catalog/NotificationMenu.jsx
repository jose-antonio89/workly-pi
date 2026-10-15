import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Button from '../ui/Button';
import {
  notificationCounts,
  notificationList,
  markAllNotificationsRead,
  markNotificationRead
} from '../../services/notificationService';

export default function NotificationMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false),
    [count, setCount] = useState(0);
  const [list, setList] = useState(null),
    [error, setError] = useState(false);
  async function refresh() {
    if (document.visibilityState !== 'hidden') setCount(await notificationCounts());
  }
  async function load() {
    try {
      const value = await notificationList();
      setList(value);
      setCount(value.items.length + value.messages);
      setError(false);
    } catch {
      setError(true);
    }
  }
  useEffect(() => {
    let mounted = true;
    const update = async () => {
      if (document.visibilityState !== 'hidden') {
        const value = await notificationCounts();
        if (mounted) setCount(value);
      }
    };
    void update();
    const timer = setInterval(update, 120000);
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('workly:notifications', update);
    return () => {
      mounted = false;
      clearInterval(timer);
      document.removeEventListener('click', close);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('workly:notifications', update);
    };
  }, []);
  async function follow(event, href, data) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) return;
    event.preventDefault();
    try {
      await markNotificationRead(data);
      await refresh();
    } catch (err) {
      console.error('Erro ao marcar notificação clicada como lida:', err);
    } finally {
      navigate(href);
    }
  }
  const itemClass =
    'grid grid-cols-[40px_minmax(0,1fr)] gap-2.5 rounded-lg bg-workly-primary/[0.075] p-2.5 text-workly-ink-warm hover:bg-workly-primary/8 dark:bg-workly-dark-accent/10 dark:text-workly-dark-text';
  const iconClass =
    'grid h-10 w-10 place-items-center rounded-lg bg-workly-primary/12 text-workly-primary-ink';
  const emptyClass = 'p-[22px] text-center font-bold text-workly-muted-warm dark:text-[#9aa59f]';
  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <Button
        appearance="custom"
        id="notificationBell"
        aria-label="Abrir notificações"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          if (!open) void load();
        }}
        className={`relative grid h-[46px] w-[46px] place-items-center rounded-lg border border-transparent text-workly-ink-warm hover:-translate-y-px hover:bg-workly-primary/10 hover:text-workly-primary-ink focus-visible:outline-2 focus-visible:outline-workly-primary legacy-max-720:h-[42px] legacy-max-720:w-[42px] legacy-max-720:rounded-lg dark:text-workly-dark-text ${open ? 'bg-workly-primary/10 text-workly-primary-ink' : ''}`}
      >
        <i aria-hidden="true" className="fas fa-bell" />
        {count > 0 && (
          <span
            id="notificationBadge"
            className="absolute -top-[5px] -right-[5px] inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#ef4444] px-[5px] text-[0.7rem] font-bold text-white shadow-[0_1px_2px_rgba(22,33,27,0.05)] dark:border-[#0c1411]"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Button>
      {open && (
        <div
          id="notificationDropdown"
          className="absolute top-[calc(100%+14px)] right-0 z-[100000] max-h-[520px] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-lg border border-[rgba(120,112,96,0.18)] bg-workly-card/98 shadow-[0_1px_2px_rgba(22,33,27,0.05)]  dark:border-[rgba(170,180,172,0.22)] dark:bg-[rgba(12,20,17,0.98)] dark:shadow-none"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[rgba(120,112,96,0.14)] px-4 pt-4 pb-3">
            <strong className="font-bold">Notificações</strong>
            <Button
              appearance="custom"
              onClick={async () => {
                try {
                  await markAllNotificationsRead();
                  await load();
                  await refresh();
                } catch (err) {
                  console.error('Erro ao marcar notificações como lidas:', err);
                }
              }}
              className="rounded-full bg-workly-primary/10 px-2.5 py-[7px] text-[13.3333px] font-bold text-[#036b33]"
            >
              Marcar lidas
            </Button>
          </div>
          <div className="max-h-[360px] overflow-auto p-2">
            {error ? (
              <div className={emptyClass}>Não foi possível carregar notificações.</div>
            ) : !list ? (
              <div className={emptyClass}>Carregando notificações...</div>
            ) : (
              <>
                {list.messages > 0 && (
                  <Link
                    to="/mensagens?notificacoes=mensagens"
                    onClick={(event) =>
                      follow(event, '/mensagens?notificacoes=mensagens', { contexto: 'mensagens' })
                    }
                    className={itemClass}
                  >
                    <span className={iconClass}>
                      <i aria-hidden="true" className="fas fa-comments" />
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                      <strong className="truncate text-[0.9rem] font-bold">
                        {list.messages} mensagem{list.messages > 1 ? 's' : ''} não lida
                        {list.messages > 1 ? 's' : ''}
                      </strong>
                      <small className="line-clamp-2 text-[0.8rem] leading-[1.35] font-semibold text-workly-muted-warm dark:text-[#9aa59f]">
                        Abra a central de mensagens para responder.
                      </small>
                    </span>
                  </Link>
                )}
                {list.items.map((item, index) => {
                  const contexto = item.tipoReferencia === 'contrato' ? 'contratos' : 'notificacao';
                  const href =
                    contexto === 'contratos'
                      ? `/contratos?notificacoes=contratos${item.referenciaId ? `&contrato=${encodeURIComponent(item.referenciaId)}` : ''}`
                      : '/perfil';
                  const date = item.createdAt ? new Date(item.createdAt) : null;
                  return (
                    <Link
                      key={item._id || item.id || index}
                      to={href}
                      onClick={(event) =>
                        follow(event, href, {
                          id: item._id || item.id,
                          contexto,
                          referenciaId: item.referenciaId
                        })
                      }
                      className={itemClass}
                    >
                      <span className={iconClass}>
                        <i
                          aria-hidden="true"
                          className={`fas ${['contrato_novo', 'proposta_nova'].includes(item.tipo) ? 'fa-briefcase' : 'fa-bell'}`}
                        />
                      </span>
                      <span className="grid min-w-0 gap-0.5">
                        <strong className="truncate text-[0.9rem] font-bold">
                          {item.titulo || 'Notificação'}
                        </strong>
                        <small className="line-clamp-2 text-[0.8rem] leading-[1.35] font-semibold text-workly-muted-warm dark:text-[#9aa59f]">
                          {item.mensagem || ''}
                        </small>
                        <em className="text-[0.72rem] font-semibold text-[#8a938d] not-italic">
                          {date && !Number.isNaN(date.getTime())
                            ? date.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : ''}
                        </em>
                      </span>
                    </Link>
                  );
                })}
                {!list.items.length && !list.messages && (
                  <div className={emptyClass}>Você está em dia. Nenhuma notificação nova.</div>
                )}
              </>
            )}
          </div>
          <Link
            className="flex justify-center border-t border-[rgba(120,112,96,0.14)] px-4 py-[13px] font-bold text-workly-primary-ink"
            to="/mensagens"
          >
            Abrir central de mensagens
          </Link>
        </div>
      )}
    </div>
  );
}
