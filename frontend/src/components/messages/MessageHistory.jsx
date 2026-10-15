import { useEffect, useRef } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../ui/Feedback';
import { defaultProfileImage } from '../../services/catalogService';
import { obterUsuario } from '../../services/authService';
import { ownMessage } from '../../services/messageService';

export function ChatEmpty({ title, message, error = false, direct = false }) {
  const Component = error ? ErrorState : EmptyState;
  return (
    <Component
      className={`grid ${direct ? 'min-h-[210px]' : 'min-h-[280px]'} content-center place-items-center gap-2 text-center text-workly-muted-warm dark:text-[#9aa59f]`}
    >
      <i
        aria-hidden="true"
        className={`fas ${error ? 'fa-triangle-exclamation' : 'fa-comments'} text-xl text-workly-muted-warm`}
      />
      <strong className="text-workly-ink-warm dark:text-[#ecebe5]">{title}</strong>
      {message && <span>{message}</span>}
    </Component>
  );
}
export default function MessageHistory({ messages, error, sendError, direct = false, id }) {
  const box = useRef(null),
    user = obterUsuario() || {};
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [messages]);
  return (
    <div
      ref={box}
      id={id || (direct ? 'chatMessages' : 'messageList')}
      className={
        direct
          ? 'min-h-[340px] overflow-auto bg-workly-paper p-4 sm:p-6'
          : 'h-full min-h-0 overflow-auto bg-workly-paper px-4 py-6 sm:px-6'
      }
    >
      {error ? (
        <ChatEmpty direct={direct} error title="Erro ao carregar mensagens" message={error} />
      ) : messages === null ? (
        <LoadingState message="Carregando mensagens..." />
      ) : messages.length ? (
        messages.map((m) => {
          const mine = ownMessage(m, user),
            date = m.createdAt ? new Date(m.createdAt) : null;
          const time = !date
            ? ''
            : direct
              ? date.toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
          return (
            <article
              key={m.idMensagem || m.id_mensagem}
              data-message-id={m.idMensagem || m.id_mensagem}
              className={`${direct ? 'mb-3' : 'mb-3.5'} grid w-fit gap-2.5 ${direct ? 'max-w-[86%] legacy-max-640:max-w-[96%]' : 'max-w-[min(680px,86%)] legacy-max-640:max-w-[96%]'} ${mine ? `ml-auto ${direct ? 'grid-cols-[minmax(0,1fr)_38px]' : 'grid-cols-[minmax(0,1fr)_40px]'}` : `${direct ? 'grid-cols-[38px_minmax(0,1fr)]' : 'grid-cols-[40px_minmax(0,1fr)]'}`}`}
            >
              <img
                src={m.remetente?.fotoPerfil || defaultProfileImage}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = defaultProfileImage;
                }}
                alt=""
                className={`${direct ? 'h-[38px] w-[38px]' : 'h-10 w-10'} rounded-full object-cover ${mine ? 'col-start-2 row-start-1' : ''}`}
              />
              <div
                className={`${mine ? 'col-start-1 row-start-1 rounded-br-sm bg-workly-forest text-workly-on-forest dark:bg-[#1d5a43]' : 'rounded-bl-sm border border-workly-rule bg-workly-card'} min-w-0 rounded-lg px-4 py-3`}
              >
                <div
                  className={`flex items-center justify-between gap-3 ${direct ? 'mb-[5px] text-[0.8rem] legacy-max-640:flex-wrap' : 'mb-2 text-[0.78rem]'} ${mine ? 'text-workly-on-forest' : 'text-workly-ink-warm'}`}
                >
                  <strong className="text-[0.82rem] font-semibold">
                    {mine ? 'Você' : m.remetente?.nome || 'Usuário'}
                  </strong>
                  <span className="text-[0.75rem] whitespace-nowrap tabular-nums opacity-75">
                    {time}
                  </span>
                </div>
                <p
                  className={`whitespace-pre-wrap [overflow-wrap:anywhere] text-[0.95rem] leading-[1.65] ${mine ? 'text-workly-on-forest' : 'text-workly-ink-warm'}`}
                >
                  {m.texto || ''}
                </p>
              </div>
            </article>
          );
        })
      ) : (
        <ChatEmpty
          direct={direct}
          title="Nenhuma mensagem ainda"
          message={
            direct
              ? 'Envie a primeira mensagem para combinar detalhes do contrato.'
              : 'Envie a primeira mensagem para alinhar detalhes do contrato.'
          }
        />
      )}
      {sendError && (
        <ErrorState className="mx-auto my-3 w-fit max-w-[80%] rounded-md bg-[#fde8e8] px-3 py-2.5 text-sm font-medium text-[#9b1c1c] dark:bg-[#fda4af]/15 dark:text-[#fda4af]">
          {sendError}
        </ErrorState>
      )}
    </div>
  );
}
