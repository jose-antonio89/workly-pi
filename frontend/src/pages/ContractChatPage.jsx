import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import { LoadingState } from '../components/ui/Feedback';
import { ModuleButton, ModuleEmpty, ModulePage, moduleSurface } from '../components/ui/ModuleUI';
import MessageHistory from '../components/messages/MessageHistory';
import MessageCompose from '../components/messages/MessageCompose';
import {
  myContracts,
  contractPrice,
  contractStatus,
  finalStatuses
} from '../services/contractService';
import {
  contractId,
  otherUser,
  contractMessages,
  sendContractMessage
} from '../services/messageService';
import { defaultServiceImage } from '../services/catalogService';

import { createRequestScope } from '../services/requestScope';

const pill =
  'inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-[7px] text-[0.82rem] font-bold text-[#475569] dark:bg-[#17233a] dark:text-[#d7e2f2]';
export default function ContractChatPage() {
  const [params] = useSearchParams(),
    id = params.get('id'),
    [contract, setContract] = useState(null),
    [error, setError] = useState(null),
    [messages, setMessages] = useState(null),
    [messageError, setMessageError] = useState(''),
    [sendError, setSendError] = useState(''),
    [text, setText] = useState(''),
    [busy, setBusy] = useState(false);
  const scope = useRef(createRequestScope());
  const sendScope = useRef(createRequestScope());
  const currentId = useRef(id);
  currentId.current = id;
  async function loadMessages(signal) {
    const requestId = id,
      isCurrent = scope.current.begin();
    try {
      const result = await contractMessages(requestId, { signal });
      if (!isCurrent() || currentId.current !== requestId) return;
      setMessages(result);
      setMessageError('');
      window.dispatchEvent(new Event('workly:notifications'));
    } catch (error) {
      if (isCurrent() && currentId.current === requestId && error.name !== 'AbortError')
        setMessageError(error.message);
    }
  }
  useEffect(() => {
    let active = true,
      timer;
    const controller = new AbortController();
    scope.current.invalidate();
    sendScope.current.invalidate();
    setContract(null);
    setMessages(null);
    setError(null);
    setMessageError('');
    setSendError('');
    setText('');
    setBusy(false);
    (async () => {
      if (!id) {
        setError([
          'Contrato não informado',
          'Volte para a página de contratos e abra o chat novamente.'
        ]);
        return;
      }
      try {
        const all = await myContracts(),
          c = all.find((c) => contractId(c) === id);
        if (!active) return;
        if (!c) {
          setError([
            'Contrato não encontrado',
            'Você não faz parte deste contrato ou ele não existe mais.'
          ]);
          return;
        }
        if (finalStatuses.includes(c.status)) {
          setError([
            'Chat indisponível',
            'O chat fica disponível apenas enquanto o contrato está ativo.'
          ]);
          return;
        }
        setContract(c);
        await loadMessages(controller.signal);
        if (active) timer = setInterval(() => loadMessages(controller.signal), 30000);
      } catch (error) {
        if (active) setError(['Erro ao carregar', error.message]);
      }
    })();
    return () => {
      active = false;
      clearInterval(timer);
      controller.abort();
      scope.current.invalidate();
      sendScope.current.invalidate();
    };
  }, [id]);
  async function send(value) {
    if (!contract || busy) return;
    const requestId = id,
      isCurrent = sendScope.current.begin();
    setBusy(true);
    setSendError('');
    try {
      await sendContractMessage(requestId, value);
      if (!isCurrent() || currentId.current !== requestId) return;
      setText('');
      await loadMessages();
    } catch (error) {
      if (isCurrent() && currentId.current === requestId)
        setSendError(error.message || 'Não foi possível enviar a mensagem.');
    } finally {
      if (isCurrent() && currentId.current === requestId) setBusy(false);
    }
  }
  return (
    <CatalogShell title="Chat do Contrato" footer="empty">
      <ModulePage
        heroClassName="legacy-max-800:[&_h1]:text-[2rem]"
        kicker={
          <>
            <i aria-hidden="true" className="fas fa-comments" />
            Conversa do contrato
          </>
        }
        title="Chat do contrato"
        description="Combine detalhes, envie atualizações e mantenha o histórico do serviço em um só lugar."
        heroRight={
          <ModuleButton className="py-0!" to="/contratos" tone="secondary">
            <i aria-hidden="true" className="fas fa-arrow-left" />
            Voltar para contratos
          </ModuleButton>
        }
      >
        <section className="grid grid-cols-[minmax(280px,360px)_minmax(0,1fr)] items-stretch gap-[22px] legacy-max-920:grid-cols-1">
          <aside id="chatContractSummary" className="min-w-0">
            {error ? (
              <ModuleEmpty error icon="fa-triangle-exclamation" title={error[0]} message={error[1]}>
                <ModuleButton className="py-0!" to="/contratos">
                  Voltar
                </ModuleButton>
              </ModuleEmpty>
            ) : !contract ? (
              <LoadingState
                message="Carregando contrato..."
                detail="Buscando informações do serviço."
              />
            ) : (
              <article className={`${moduleSurface} sticky top-[110px] legacy-max-920:static`}>
                <img
                  src={contract.imagemServico || defaultServiceImage}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = defaultServiceImage;
                  }}
                  className="h-[170px] w-full object-cover"
                />
                <div className="p-5">
                  <span className={pill}>{contractStatus(contract.status)}</span>
                  <h3 className="mb-2 text-[1.15rem] font-bold">
                    {contract.nomeServico || 'Serviço'}
                  </h3>
                  <p className="mb-3.5 leading-[1.55] text-[#64748b] dark:text-[#aebbd0]">
                    {String(
                      contract.descricaoServico || 'Contrato criado pela plataforma Workly.'
                    ).slice(0, 150)}
                  </p>
                  <div className="my-3 flex flex-wrap gap-2">
                    {[
                      ['fa-user', otherUser(contract).nome || 'Usuário'],
                      [
                        'fa-handshake',
                        contract.tipoContratacao === 'fixo'
                          ? 'Preço fixo'
                          : contract.tipoContratacao === 'combinar'
                            ? 'Valor a combinar'
                            : 'Negociação'
                      ],
                      ['fa-money-bill-wave', contractPrice(contract)[1]]
                    ].map(([icon, text]) => (
                      <span key={icon} className={pill}>
                        <i aria-hidden="true" className={`fas ${icon}`} />
                        {text}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2.5">
                    {contract.idServico && (
                      <ModuleButton
                        className="py-0!"
                        to={`/detalhe-servico?id=${contract.idServico}`}
                        tone="secondary"
                      >
                        <i aria-hidden="true" className="fas fa-eye" />
                        Ver serviço
                      </ModuleButton>
                    )}
                    <ModuleButton className="py-0!" to="/contratos" tone="secondary">
                      <i aria-hidden="true" className="fas fa-briefcase" />
                      Ver contratos
                    </ModuleButton>
                  </div>
                </div>
              </article>
            )}
          </aside>
          <section
            id="chatRoom"
            className="grid min-h-[680px] min-w-0 grid-rows-[auto_minmax(320px,1fr)_auto] overflow-hidden rounded-[26px] border border-[#94a3b8]/18 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)] legacy-max-920:min-h-[620px] legacy-max-640:min-h-[560px] legacy-max-640:rounded-[20px] dark:border-[#5e82ac]/22 dark:bg-transparent dark:bg-[linear-gradient(160deg,rgba(14,25,42,0.96),rgba(10,18,34,0.92))]"
          >
            <header className="border-b border-[#94a3b8]/16 bg-[radial-gradient(circle_at_12%_0%,rgba(4,191,85,.10),transparent_30%),linear-gradient(180deg,#ffffff,#f8fbff)] px-6 py-[22px] dark:bg-[#0a1222]/35 dark:bg-[radial-gradient(circle_at_12%_0%,rgba(74,222,128,.12),transparent_30%)]">
              <span id="chatStatusLabel" className={pill}>
                {contract ? contractStatus(contract.status) : 'Contrato'}
              </span>
              <h2
                id="chatRoomTitle"
                className="mt-2.5 mb-1 text-[2rem] font-bold text-[#0f172a] legacy-max-800:text-[1.45rem] dark:text-[#eef4ff]"
              >
                {contract?.nomeServico || 'Mensagens'}
              </h2>
              <p className="font-[650] text-[#64748b] dark:text-[#a9b9cf]">
                {contract
                  ? `Conversa com ${otherUser(contract).nome || 'a outra parte'}`
                  : 'Carregando conversa...'}
              </p>
            </header>
            {error ? (
              <div id="chatMessages" />
            ) : (
              <MessageHistory
                direct
                messages={messages}
                error={messageError}
                sendError={sendError}
              />
            )}{' '}
            {!error && (
              <MessageCompose direct text={text} setText={setText} busy={busy} onSend={send} />
            )}
          </section>
        </section>
      </ModulePage>
    </CatalogShell>
  );
}
