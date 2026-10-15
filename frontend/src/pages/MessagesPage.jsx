import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import Button from '../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback';
import { ModuleButton } from '../components/ui/ModuleUI';
import MessageHistory from '../components/messages/MessageHistory';
import MessageCompose from '../components/messages/MessageCompose';
import ContractDetails from '../components/messages/ContractDetails';
import { myContracts, contractStatus } from '../services/contractService';
import {
  activeChatStatuses,
  contractId,
  otherUser,
  messageSummaries,
  conversationPreviews,
  contractMessages,
  sendContractMessage
} from '../services/messageService';
import { defaultProfileImage } from '../services/catalogService';
import { obterUsuario } from '../services/authService';
import { markNotificationRead } from '../services/notificationService';

function ConversationEmpty({ title, message, error = false, children }) {
  const Component = error ? ErrorState : EmptyState;
  return (
    <Component className="grid min-h-[220px] content-center justify-items-center gap-2.5 p-7 text-center font-bold text-[#64748b] dark:text-[#a9b9cf]">
      <i
        aria-hidden="true"
        className={`fas ${error ? 'fa-triangle-exclamation' : title === 'Nenhuma conversa encontrada' ? 'fa-magnifying-glass' : 'fa-comments'} text-[2rem] text-workly-primary`}
      />
      <strong className="text-[#0f172a] dark:text-[#eef4ff]">{title}</strong>
      <span>{message}</span>
      {children}
    </Component>
  );
}
export default function MessagesPage() {
  const [params] = useSearchParams(),
    location = useLocation(),
    navigate = useNavigate(),
    [contracts, setContracts] = useState(null),
    [previews, setPreviews] = useState({}),
    [selected, setSelected] = useState(''),
    [search, setSearch] = useState(''),
    [error, setError] = useState(''),
    [messages, setMessages] = useState(null),
    [messageError, setMessageError] = useState(''),
    [sendError, setSendError] = useState(''),
    [text, setText] = useState(''),
    [busy, setBusy] = useState(false),
    [details, setDetails] = useState(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const requested = params.get('contrato') || params.get('id'),
    context = params.get('notificacoes');
  useEffect(() => {
    let active = true;
    (async () => {
      if (context === 'mensagens')
        try {
          await markNotificationRead({ contexto: 'mensagens' });
          window.dispatchEvent(new Event('workly:notifications'));
        } catch (error) {
          console.error('Erro ao limpar notificações de mensagens:', error);
        }
      try {
        const all = (await myContracts()).filter((c) => activeChatStatuses.includes(c.status));
        if (!active) return;
        let summaries = [],
          failed = false;
        try {
          summaries = await messageSummaries();
        } catch {
          failed = true;
        }
        if (!active) return;
        setContracts(all);
        setPreviews(conversationPreviews(all, summaries, obterUsuario() || {}, failed));
        const initial = all.find((c) => contractId(c) === requested) || all[0];
        setSelected(initial ? contractId(initial) : '');
      } catch (error) {
        if (active) {
          setError(error.message);
          setContracts([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [context]);
  useEffect(() => {
    if (!contracts?.length || !requested) return;
    const c = contracts.find((c) => contractId(c) === requested);
    if (c) setSelected(contractId(c));
  }, [requested, contracts]);
  const active = contracts?.find((c) => contractId(c) === selected);
  useEffect(() => {
    let mounted = true;
    if (!selected) return;
    setText('');
    setSendError('');
    setDetails(false);
    setBusy(false);
    setPreviews((value) => ({ ...value, [selected]: { ...value[selected], unread: 0 } }));
    const next = new URLSearchParams(params);
    next.set('contrato', selected);
    navigate(
      { pathname: location.pathname, search: '?' + next.toString(), hash: location.hash },
      { replace: true }
    );
    async function load() {
      try {
        const value = await contractMessages(selected);
        if (mounted) {
          setMessages(value);
          setMessageError('');
        }
      } catch (error) {
        if (mounted) setMessageError(error.message);
      }
    }
    setMessages(null);
    setMessageError('');
    load();
    const timer = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [selected]);
  const closeDetails = useCallback(() => setDetails(false), []);
  async function send(value) {
    const id = selected;
    setBusy(true);
    setSendError('');
    try {
      await sendContractMessage(id, value);
      if (selectedRef.current !== id) return;
      setPreviews((current) => ({
        ...current,
        [id]: {
          text: value,
          mine: true,
          date: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          unread: 0
        }
      }));
      setText('');
      const result = await contractMessages(id);
      if (selectedRef.current === id) {
        setMessages(result);
        setMessageError('');
      }
    } catch (error) {
      if (selectedRef.current === id)
        setSendError(error.message || 'Não foi possível enviar a mensagem.');
    } finally {
      if (selectedRef.current === id) setBusy(false);
    }
  }
  const term = search.trim().toLowerCase(),
    filtered = (contracts || []).filter((c) =>
      [
        c.nomeServico,
        c.descricaoServico,
        otherUser(c).nome,
        contractStatus(c.status),
        previews[contractId(c)]?.text
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(term)
      )
    );
  return (
    <CatalogShell title="Mensagens" footer="empty">
      <main className="flex min-h-[calc(100vh-40px)] items-stretch px-[18px] pt-2.5 pb-[18px] legacy-max-980:block legacy-max-980:min-h-0 legacy-max-980:px-3 legacy-max-980:pt-3 legacy-max-980:pb-7">
        <section className="mx-auto grid h-[calc(100vh-55px)] min-h-[780px] w-full max-w-[1420px] grid-cols-[minmax(310px,390px)_minmax(0,1fr)] overflow-hidden rounded-[30px] border border-[#94a3b8]/18 bg-white/78 shadow-[0_28px_90px_rgba(15,23,42,0.10)] backdrop-blur-[18px] [@media(min-width:981px)_and_(min-height:900px)]:h-[calc(100vh-70px)] [@media(min-width:981px)_and_(min-height:900px)]:min-h-[840px] legacy-max-980:h-auto legacy-max-980:min-h-[calc(100vh-80px)] legacy-max-980:grid-cols-1 legacy-max-640:min-h-[calc(100vh-64px)] legacy-max-640:rounded-[22px] dark:border-[#5e82ac]/22 dark:bg-[#0a1222]/86 dark:shadow-[0_32px_100px_rgba(0,4,18,0.48)]">
          <aside className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] border-r border-[#94a3b8]/16 bg-[#f8fbff]/86 legacy-max-980:max-h-[430px] legacy-max-980:grid-rows-[auto_auto] legacy-max-980:border-r-0 legacy-max-980:border-b dark:border-[#94a3b8]/14 dark:bg-[#0a1222]/92">
            <div className="border-b border-[#94a3b8]/14 px-[22px] pt-[22px] pb-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-workly-primary/12 px-3.5 py-2 text-[0.9rem] font-extrabold text-[#029d47]">
                <i aria-hidden="true" className="fas fa-comments" />
                Central
              </span>
              <h1
                style={{ fontWeight: 900 }}
                className="mt-2 mb-1 text-[2rem] leading-[1.05] text-[#0f172a] dark:text-[#eef4ff]"
              >
                Mensagens
              </h1>
              <p className="mb-4 font-[650] text-[#64748b] dark:text-[#a9b9cf]">
                Converse dentro dos contratos ativos.
              </p>
              <div className="flex h-12 items-center gap-2.5 rounded-2xl border border-[#94a3b8]/22 bg-white px-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.045)] focus-within:outline-2 focus-within:outline-workly-primary dark:border-[#5e82ac]/20 dark:bg-[#0f172a]/88">
                <i aria-hidden="true" className="fas fa-search text-workly-primary" />
                <input
                  id="conversationSearch"
                  type="search"
                  aria-label="Buscar conversa"
                  placeholder="Buscar conversa..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent font-bold text-[#0f172a] outline-none dark:text-[#eef4ff]"
                />
              </div>
            </div>
            <div id="conversationList" className="min-h-0 overflow-auto p-3">
              {error ? (
                <ConversationEmpty error title="Erro ao carregar conversas" message={error} />
              ) : contracts === null ? (
                <LoadingState
                  inline
                  message="Carregando conversas..."
                  className="grid min-h-[220px] content-center p-7 text-center font-bold text-[#64748b]"
                />
              ) : !contracts.length ? (
                <ConversationEmpty
                  title="Nenhuma conversa ativa"
                  message="Chats aparecem aqui quando existir contrato ativo."
                >
                  <ModuleButton to="/todos-servicos">Explorar serviços</ModuleButton>
                </ConversationEmpty>
              ) : !filtered.length ? (
                <ConversationEmpty
                  title="Nenhuma conversa encontrada"
                  message="Tente buscar pelo nome do serviço ou usuário."
                />
              ) : (
                filtered.map((c) => {
                  const id = contractId(c),
                    other = otherUser(c),
                    preview = previews[id] || {
                      text: c.mensagem || 'Nenhuma mensagem ainda.',
                      unread: 0
                    },
                    chosen = id === selected;
                  return (
                    <Button
                      appearance="custom"
                      data-conversation={id}
                      key={id}
                      aria-pressed={chosen}
                      onClick={() => {
                        setSelected(id);
                        setPreviews((value) => ({ ...value, [id]: { ...value[id], unread: 0 } }));
                        if (chosen)
                          contractMessages(id)
                            .then(setMessages)
                            .catch((error) => setMessageError(error.message));
                      }}
                      className={`relative grid w-full grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-workly-primary legacy-max-640:grid-cols-[50px_minmax(0,1fr)_auto] ${chosen ? 'border-workly-primary/18 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.07)] dark:border-[#5e82ac]/20 dark:bg-[#0f172a]/88' : 'border-transparent hover:border-workly-primary/18 hover:bg-white dark:hover:bg-[#0f172a]/88'}`}
                    >
                      <img
                        src={other.fotoPerfil || other.foto_perfil || defaultProfileImage}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = defaultProfileImage;
                        }}
                        className="h-[54px] w-[54px] rounded-full bg-[#e8f5ee] object-cover"
                      />
                      <span className="grid min-w-0 gap-[3px]">
                        <strong className="truncate text-[0.98rem] leading-[1.25] font-black text-[#0f172a] dark:text-[#eef4ff]">
                          {other.nome || 'Usuário'}
                        </strong>
                        <small className="truncate text-[0.75rem] font-[750] text-[#7b8aa0] dark:text-[#8fa3c4]">
                          {c.nomeServico || 'Serviço'}
                        </small>
                        <em className="line-clamp-2 text-[0.82rem] leading-[1.3] font-bold text-[#475569] not-italic dark:text-[#cbd5e1]">
                          {preview.mine ? 'Você: ' : ''}
                          {preview.text || 'Nenhuma mensagem ainda.'}
                        </em>
                      </span>
                      <span className="flex min-w-12 self-stretch items-start justify-end pt-1">
                        <span className="flex min-h-[22px] items-center justify-end gap-2">
                          {preview.date && (
                            <small className="text-[0.74rem] font-black whitespace-nowrap text-[#94a3b8]">
                              {preview.date}
                            </small>
                          )}
                          {preview.unread > 0 && (
                            <span
                              aria-label={`${preview.unread} mensagem${preview.unread > 1 ? 's' : ''} não lida${preview.unread > 1 ? 's' : ''}`}
                              className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-workly-primary/16 px-[7px] text-[0.72rem] leading-none font-black text-[#04984a] dark:bg-[#4ade80]/18 dark:text-[#6ee7a8]"
                            >
                              {preview.unread > 9 ? '9+' : preview.unread}
                            </span>
                          )}
                        </span>
                      </span>
                    </Button>
                  );
                })
              )}
            </div>
          </aside>
          <section
            id="messagePanel"
            className="min-h-0 min-w-0 bg-[#f8fbff] legacy-max-980:min-h-[760px] legacy-max-640:min-h-[700px] dark:bg-[#070d1a]/52"
          >
            {active ? (
              <article className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] legacy-max-980:min-h-[760px] legacy-max-640:min-h-[700px]">
                <header className="flex min-h-[150px] items-center justify-between gap-[18px] border-b border-[#94a3b8]/16 bg-[radial-gradient(circle_at_10%_0%,rgba(4,191,85,.12),transparent_35%),linear-gradient(90deg,#f7fffb,#ffffff)] px-[30px] py-6 legacy-max-980:flex-col legacy-max-980:items-stretch dark:border-[#94a3b8]/14 dark:bg-[#0e1929] dark:bg-none">
                  <div className="min-w-0">
                    <span
                      className={`mb-3 inline-flex rounded-full px-[11px] py-[7px] text-[0.75rem] font-black ${active.status === 'em_andamento' ? 'bg-[#2563eb]/10 text-[#2563eb]' : active.status === 'proposta_aceita' ? 'bg-[#047857]/10 text-[#047857]' : 'bg-[#f59e0b]/12 text-[#9a5b00]'}`}
                    >
                      {contractStatus(active.status)}
                    </span>
                    <h2 className="mb-2 text-[2.4rem] leading-[1.14] font-black text-[#071226] [overflow-wrap:anywhere] legacy-max-980:text-[1.55rem] [letter-spacing:-0.055em] dark:text-[#eef4ff]">
                      {active.nomeServico || 'Contrato'}
                    </h2>
                    <p className="font-[750] text-[#64748b] dark:text-[#a9b9cf]">
                      Conversa com <strong>{otherUser(active).nome || 'Usuário'}</strong>
                    </p>
                  </div>
                  <Button
                    appearance="custom"
                    id="openContractDetails"
                    onClick={() => setDetails(true)}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-[9px] rounded-[14px] border border-[#94a3b8]/26 bg-white/74 px-4 text-[0.9rem] font-black text-[#071226] shadow-[0_10px_22px_rgba(15,23,42,0.055)] hover:text-workly-primary focus-visible:outline-2 focus-visible:outline-workly-primary legacy-max-980:self-start legacy-max-640:min-h-[42px] legacy-max-640:px-[13px] legacy-max-640:text-[0.82rem] dark:border-[#5e82ac]/26 dark:bg-[#0f172a]/68 dark:text-[#eef4ff]"
                  >
                    <i aria-hidden="true" className="fas fa-circle-info" />
                    Detalhes
                  </Button>
                </header>
                <MessageHistory messages={messages} error={messageError} sendError={sendError} />
                <MessageCompose
                  key={selected}
                  text={text}
                  setText={setText}
                  busy={busy}
                  onSend={send}
                />
              </article>
            ) : (
              <EmptyState className="grid min-h-full content-center justify-items-center gap-3 p-12 text-center text-[#64748b] dark:text-[#a9b9cf]">
                <i
                  aria-hidden="true"
                  className="fas fa-message grid h-[76px] w-[76px] place-items-center rounded-[24px] bg-workly-primary/12 text-[2rem] text-workly-primary"
                />
                <h2 className="text-[2rem] font-bold text-[#0f172a] dark:text-[#eef4ff]">
                  Selecione uma conversa
                </h2>
                <p className="max-w-[420px] leading-[1.6] font-semibold">
                  Escolha um contrato ativo para visualizar o histórico de mensagens.
                </p>
              </EmptyState>
            )}
          </section>
        </section>
      </main>
      {details && active && <ContractDetails contract={active} onClose={closeDetails} />}
    </CatalogShell>
  );
}
