import { useEffect, useRef } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../ui/Feedback';
import { defaultProfileImage } from '../../services/catalogService';
import { obterUsuario } from '../../services/authService';
import { ownMessage } from '../../services/messageService';

export function ChatEmpty({ title, message, error = false, direct = false }) {
  const Component = error ? ErrorState : EmptyState;
  return (
    <Component
      className={`grid ${direct ? 'min-h-[210px]' : 'min-h-[280px]'} content-center place-items-center gap-2 text-center text-[#64748b] dark:text-[#a9b9cf]`}
    >
      <i
        aria-hidden="true"
        className={`fas ${error ? 'fa-triangle-exclamation' : 'fa-comments'} text-[2rem] text-workly-primary`}
      />
      <strong className="text-[#0f172a] dark:text-[#eef4ff]">{title}</strong>
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
          ? 'min-h-[340px] overflow-auto bg-[linear-gradient(180deg,#f8fbff,#f1f5f9)] p-[22px] dark:bg-[#070d1a]/48 dark:bg-none'
          : 'h-full min-h-0 overflow-auto bg-[linear-gradient(rgba(248,251,255,0.92),rgba(241,245,249,0.96)),radial-gradient(circle_at_25%_15%,rgba(4,191,85,.08),transparent_28%)] px-[22px] py-[26px] [@media(min-height:900px)]:py-8 dark:bg-[#070d1a]/52 dark:bg-none'
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
              className={`${direct ? 'mb-3' : 'mb-3.5'} grid gap-2.5 ${direct ? 'max-w-[86%] legacy-max-640:max-w-[96%]' : 'max-w-[min(680px,86%)] legacy-max-640:max-w-[96%]'} ${mine ? `ml-auto ${direct ? 'grid-cols-[minmax(0,1fr)_38px]' : 'grid-cols-[minmax(0,1fr)_40px]'}` : `${direct ? 'grid-cols-[38px_minmax(0,1fr)]' : 'grid-cols-[40px_minmax(0,1fr)]'}`}`}
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
                className={`${mine ? 'col-start-1 row-start-1' : ''} min-w-0 border shadow-[0_10px_22px_rgba(15,23,42,0.055)] ${direct ? 'rounded-2xl px-[13px] py-[11px]' : 'rounded-2xl px-4 py-3.5'} ${mine ? (direct ? 'border-workly-primary/18 bg-workly-primary/12 dark:border-[#4ade80]/18 dark:bg-[rgba(74,222,128,.12)]' : 'border-workly-primary/22 bg-[linear-gradient(180deg,rgba(206,247,224,0.95),rgba(197,241,217,0.95))] dark:border-[#4ade80]/20 dark:bg-[#4ade80]/13 dark:bg-none') : 'border-[#94a3b8]/16 bg-white dark:border-[#5e82ac]/20 dark:bg-[#0f172a]/88'}`}
              >
                <div
                  className={`flex items-center justify-between gap-3 ${direct ? 'mb-[5px] text-[0.8rem] legacy-max-640:flex-wrap' : 'mb-2 text-[0.78rem]'} text-[#0f172a] dark:text-[#eef4ff]`}
                >
                  <strong className={direct ? '' : 'text-[0.82rem] font-black'}>
                    {mine ? 'Você' : m.remetente?.nome || 'Usuário'}
                  </strong>
                  <span className="text-[0.76rem] font-extrabold whitespace-nowrap text-[#7c8ba1] dark:text-[#8fa3c4]">
                    {time}
                  </span>
                </div>
                <p
                  className={`whitespace-pre-wrap [overflow-wrap:anywhere] ${direct ? 'leading-[1.5] text-[#334155]' : `text-[0.98rem] leading-[1.62] font-medium legacy-max-640:text-[0.94rem] ${mine ? 'text-[#18372b] dark:text-[#e8fff1]' : 'text-[#253248]'}`} ${direct ? 'dark:text-[#eef4ff]' : 'dark:text-[#dbeafe]'}`}
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
        <ErrorState className="mx-auto my-3 w-fit max-w-[80%] rounded-[14px] bg-[#fff1f2] px-3 py-2.5 font-extrabold text-[#be123c]">
          {sendError}
        </ErrorState>
      )}
    </div>
  );
}
