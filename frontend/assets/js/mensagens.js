// script para página de mensagens

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.Workly.getToken()) {
    location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(location.search);
  const initialContratoId = params.get('contrato') || params.get('id');

  const veioDoSinoMensagens = params.get('notificacoes') === 'mensagens';

  async function limparNotificacoesDeMensagens() {
    try {
      await window.Workly.apiFetch('/api/notificacoes/contexto/lidas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contexto: 'mensagens' })
      });
      await window.Workly.refreshNotificationBadge?.();
    } catch (error) {
      console.error('Erro ao limpar notificações de mensagens:', error);
    }
  }

  const conversationList = document.getElementById('conversationList');
  const conversationSearch = document.getElementById('conversationSearch');
  const messagePanel = document.getElementById('messagePanel');
  const detailModal = document.getElementById('contractDetailsModal');
  const detailContent = document.getElementById('contractDetailContent');
  const detailTitle = document.getElementById('contractDetailTitle');

  // só mostramos chat pra contrato ainda ativo.
// cancelado/concluído não entra na central.
const ACTIVE_STATUSES = ['pendente', 'proposta_pendente', 'proposta_aceita', 'em_andamento'];
  let contratos = [];
  let filteredContratos = [];
  let activeContrato = null;
  let refreshTimer = null;
  const conversationPreviews = new Map();
  const conversationUnread = new Map();

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c]));
  }

  function statusLabel(status = '') {
    const labels = {
      pendente: 'Aguardando início',
      proposta_pendente: 'Proposta pendente',
      proposta_aceita: 'Proposta aceita',
      em_andamento: 'Em andamento',
      concluido: 'Entrega concluída',
      cancelado: 'Cancelado',
      encerrado: 'Concluído'
    };
    return labels[status] || String(status).replace('_', ' ');
  }

  function tipoLabel(c) {
    if (c.tipoContratacao === 'fixo') return 'Preço fixo';
    if (c.tipoContratacao === 'combinar') return 'Valor a combinar';
    return 'Negociação';
  }

  function priceLabel(c) {
    if (c.tipoContratacao === 'combinar' && !c.preco && !c.precoProposto && !c.preco_proposto) {
      return 'Valor a combinar';
    }

    if (c.precoProposto || c.preco_proposto) {
      return `Proposta: ${window.Workly.formatCurrency(c.precoProposto || c.preco_proposto)}`;
    }

    return window.Workly.formatCurrency(c.preco || 0);
  }

  function otherUser(c) {
    return c.papel === 'cliente' ? c.freelancer : c.cliente;
  }

  function userPhoto(user = {}) {
    return user.fotoPerfil || user.foto_perfil || '../assets/img/perfis/perfil_padrao.svg';
  }

  function userPublicProfileUrl(user = {}) {
    const id = user.idUsuario || user.id_usuario || user._id || user.id;
    return id ? `perfil-publico.html?id=${encodeURIComponent(id)}` : '#';
  }

  function getContractId(c) {
    return String(c.idContrato || c.id_contrato || c._id || '');
  }

  function isActiveContract(c) {
    return ACTIVE_STATUSES.includes(c.status);
  }

  // carrega preview e badge da lista lateral sem marcar mensagem como lida.
async function loadConversationPreviews() {
    try {
      const response = await window.Workly.apiFetch('/api/mensagens/resumo');
      const resumos = response.dados || [];
      const resumoPorContrato = new Map(resumos.map(item => [String(item.contratoId || item.contrato_id), item]));

      contratos.forEach((contrato) => {
        const id = getContractId(contrato);
        const resumo = resumoPorContrato.get(id);
        const last = resumo?.ultimaMensagem;

        if (!last) {
          conversationUnread.set(id, 0);
          conversationPreviews.set(id, {
            text: contrato.mensagem || 'Nenhuma mensagem ainda.',
            mine: false,
            date: ''
          });
          return;
        }

        const storedUser = window.Workly.getStoredUser?.() || {};
        const currentUserId = String(storedUser.idUsuario || storedUser.id_usuario || '');
        const remetente = last.remetente || {};
        const mine = String(remetente.idUsuario || remetente.id_usuario || '') === currentUserId;
        const date = last.createdAt
          ? new Date(last.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : '';

        conversationUnread.set(id, Number(resumo.naoLidas || resumo.nao_lidas || 0));
        conversationPreviews.set(id, {
          text: last.texto || '',
          mine,
          date
        });
      });
    } catch (error) {
      contratos.forEach((contrato) => {
        const id = getContractId(contrato);
        conversationUnread.set(id, 0);
        conversationPreviews.set(id, {
          text: contrato.mensagem || 'Não foi possível carregar a última mensagem.',
          mine: false,
          date: ''
        });
      });
    }
  }

  // busca os contratos do usuário e monta a lista de conversas.
async function loadContracts() {
    conversationList.innerHTML = '<div class="conversation-loading">Carregando conversas...</div>';

    try {
      const response = await window.Workly.apiFetch('/api/contratos/meus');
      contratos = (response.dados || []).filter(isActiveContract);
      filteredContratos = [...contratos];

      if (!contratos.length) {
        conversationList.innerHTML = `<div class="conversation-empty">
          <i class="fas fa-comments"></i>
          <strong>Nenhuma conversa ativa</strong>
          <span>Chats aparecem aqui quando existir contrato ativo.</span>
          <a href="todos-servicos.html" class="module-btn primary">Explorar serviços</a>
        </div>`;
        renderEmptyPanel();
        return;
      }

      await loadConversationPreviews();
      renderConversationList();

      const initial = initialContratoId
        ? contratos.find(c => getContractId(c) === String(initialContratoId))
        : contratos[0];

      if (initial) selectConversation(getContractId(initial));
      else selectConversation(getContractId(contratos[0]));
    } catch (error) {
      conversationList.innerHTML = `<div class="conversation-empty error">
        <i class="fas fa-triangle-exclamation"></i>
        <strong>Erro ao carregar conversas</strong>
        <span>${esc(error.message)}</span>
      </div>`;
      renderEmptyPanel();
    }
  }

  // desenha a coluna da esquerda com pessoa, serviço, última mensagem e badge.
function renderConversationList() {
    if (!filteredContratos.length) {
      conversationList.innerHTML = `<div class="conversation-empty">
        <i class="fas fa-magnifying-glass"></i>
        <strong>Nenhuma conversa encontrada</strong>
        <span>Tente buscar pelo nome do serviço ou usuário.</span>
      </div>`;
      return;
    }

    conversationList.innerHTML = filteredContratos.map(c => {
      const id = getContractId(c);
      const outro = otherUser(c) || {};
      const active = activeContrato && getContractId(activeContrato) === id;
      const preview = conversationPreviews.get(id) || { text: c.mensagem || 'Nenhuma mensagem ainda.', mine: false, date: '' };
      const unreadCount = Number(conversationUnread.get(id) || 0);
      const previewText = `${preview.mine ? 'Você: ' : ''}${preview.text || 'Nenhuma mensagem ainda.'}`;
      return `<button class="conversation-item ${active ? 'active' : ''}" data-conversation="${esc(id)}" type="button">
        <img src="${esc(userPhoto(outro))}" onerror="this.src='../assets/img/perfis/perfil_padrao.svg'" alt="">
        <span class="conversation-info">
          <strong>${esc(outro.nome || 'Usuário')}</strong>
          <small>${esc(c.nomeServico || 'Serviço')}</small>
          <em>${esc(previewText)}</em>
        </span>
        <span class="conversation-meta">
          <span class="conversation-meta-top">
            ${preview.date ? `<small>${esc(preview.date)}</small>` : ''}
            ${unreadCount > 0 ? `<span class="conversation-unread-badge" aria-label="${esc(String(unreadCount))} mensagem${unreadCount > 1 ? 's' : ''} não lida${unreadCount > 1 ? 's' : ''}">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
          </span>
        </span>
      </button>`;
    }).join('');

    conversationList.querySelectorAll('[data-conversation]').forEach(btn => {
      btn.addEventListener('click', () => selectConversation(btn.dataset.conversation));
    });
  }

  function renderEmptyPanel() {
    messagePanel.innerHTML = `<div class="message-empty-state">
      <i class="fas fa-message"></i>
      <h2>Selecione uma conversa</h2>
      <p>Escolha um contrato ativo para visualizar o histórico de mensagens.</p>
    </div>`;
  }

  // quando escolhe uma conversa, abre o chat e zera o badge daquela conversa.
async function selectConversation(id) {
    const contrato = contratos.find(c => getContractId(c) === String(id));
    if (!contrato) return;

    activeContrato = contrato;
    conversationUnread.set(String(id), 0);
    renderConversationList();
    renderChatShell(contrato);
    await loadMessages();

    const url = new URL(location.href);
    url.searchParams.set('contrato', getContractId(contrato));
    history.replaceState(null, '', url.toString());
  }

  // monta o lado direito: cabeçalho do contrato, mensagens e campo de envio.
function renderChatShell(c) {
    const outro = otherUser(c) || {};
    messagePanel.innerHTML = `<article class="message-chat">
      <header class="message-chat-hero">
        <div class="message-chat-main">
          <span class="message-status ${esc(c.status || '')}">${esc(statusLabel(c.status))}</span>
          <h2>${esc(c.nomeServico || 'Contrato')}</h2>
          <p>Conversa com <strong>${esc(outro.nome || 'Usuário')}</strong></p>
        </div>
        <div class="message-chat-actions">
          <button class="message-top-action" type="button" id="openContractDetails"><i class="fas fa-circle-info"></i> Detalhes</button>
        </div>
      </header>

      <div id="messageList" class="message-list">
        ${window.Workly.loadingMarkup('Carregando mensagens...')}
      </div>

      <form id="messageForm" class="message-compose">
        <textarea id="messageText" maxlength="2000" placeholder="Digite sua mensagem..." required></textarea>
        <button type="submit" class="module-btn primary"><i class="fas fa-paper-plane"></i> Enviar</button>
      </form>
    </article>`;

    const messageForm = document.getElementById('messageForm');
    const messageText = document.getElementById('messageText');

    document.getElementById('openContractDetails')?.addEventListener('click', () => openContractDetails(c));
    messageForm?.addEventListener('submit', sendMessage);

    messageText?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;

      event.preventDefault();

      const texto = String(messageText.value || '').trim();
      if (!texto) return;

      if (typeof messageForm.requestSubmit === 'function') {
        messageForm.requestSubmit();
      } else {
        messageForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    });
  }

  // aqui a conversa é aberta de verdade, então o backend marca as mensagens como lidas.
async function loadMessages() {
    if (!activeContrato) return;
    const messageList = document.getElementById('messageList');
    if (!messageList) return;

    try {
      const response = await window.Workly.apiFetch(`/api/mensagens/contrato/${getContractId(activeContrato)}`);
      const mensagens = response.dados || [];

      messageList.innerHTML = mensagens.length
        ? mensagens.map(messageMarkup).join('')
        : `<div class="message-list-empty">
          <i class="fas fa-comments"></i>
          <strong>Nenhuma mensagem ainda</strong>
          <span>Envie a primeira mensagem para alinhar detalhes do contrato.</span>
        </div>`;

      messageList.scrollTop = messageList.scrollHeight;
    } catch (error) {
      messageList.innerHTML = `<div class="message-list-empty error">
        <i class="fas fa-triangle-exclamation"></i>
        <strong>Erro ao carregar mensagens</strong>
        <span>${esc(error.message)}</span>
      </div>`;
    }
  }

  function messageMarkup(m) {
    const user = m.remetente || {};
    const storedUser = window.Workly.getStoredUser?.() || {};
    const mine = String(user.idUsuario || user.id_usuario || '') === String(storedUser.idUsuario || storedUser.id_usuario || '');
    const time = m.createdAt
      ? new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '';
    const date = m.createdAt
      ? new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      : '';

    return `<article class="message-bubble ${mine ? 'mine' : 'theirs'}">
      <img src="${esc(user.fotoPerfil || '../assets/img/perfis/perfil_padrao.svg')}" onerror="this.src='../assets/img/perfis/perfil_padrao.svg'" alt="">
      <div>
        <div class="message-bubble-head">
          <strong>${esc(mine ? 'Você' : (user.nome || 'Usuário'))}</strong>
          <span class="message-time">${esc(date)} · ${esc(time)}</span>
        </div>
        <p>${esc(m.texto || '')}</p>
      </div>
    </article>`;
  }

  async function sendMessage(event) {
    event.preventDefault();

    const textArea = document.getElementById('messageText');
    const texto = String(textArea?.value || '').trim();
    if (!texto || !activeContrato) return;

    const button = event.currentTarget.querySelector('button[type="submit"]');
    const old = button?.innerHTML;

    if (button) {
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    }

    try {
      await window.Workly.apiFetch('/api/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contratoId: getContractId(activeContrato), texto })
      });

      conversationUnread.set(getContractId(activeContrato), 0);
      conversationPreviews.set(getContractId(activeContrato), {
        text: texto,
        mine: true,
        date: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      textArea.value = '';
      renderConversationList();
      await loadMessages();
    } catch (error) {
      const messageList = document.getElementById('messageList');
      messageList?.insertAdjacentHTML('beforeend', `<div class="message-send-error">${esc(error.message || 'Não foi possível enviar a mensagem.')}</div>`);
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = old;
      }
    }
  }

  // modal de detalhes do contrato.
// deixamos separado pra não lotar o topo do chat de informação.
function openContractDetails(c) {
    const outro = otherUser(c) || {};
    if (detailTitle) detailTitle.textContent = c.nomeServico || 'Contrato';

    detailContent.innerHTML = `<div class="contract-detail-grid">
      <div class="contract-detail-cover">
        <img src="${esc(c.imagemServico || '../assets/img/servicos/servico_padrao.svg')}" onerror="this.src='../assets/img/servicos/servico_padrao.svg'" alt="">
      </div>
      <div class="contract-detail-info">
        <span class="module-pill status ${esc(c.status || '')}">${esc(statusLabel(c.status))}</span>
        <h3>${esc(c.nomeServico || 'Serviço')}</h3>
        <p>${esc(c.descricaoServico || 'Contrato criado pela plataforma Workly.')}</p>
      </div>
    </div>

    <dl class="contract-detail-list">
      <div><dt>Conversa com</dt><dd><a class="contract-user-link" href="${esc(userPublicProfileUrl(outro))}">${esc(outro.nome || 'Usuário')}</a></dd></div>
      <div><dt>Seu papel</dt><dd>${c.papel === 'cliente' ? 'Contratante' : 'Freelancer'}</dd></div>
      <div><dt>Tipo</dt><dd>${esc(tipoLabel(c))}</dd></div>
      <div><dt>Valor</dt><dd>${esc(priceLabel(c))}</dd></div>
      <div><dt>Prazo desejado</dt><dd>${esc(c.prazoDesejado || c.prazo_desejado || 'Não informado')}</dd></div>
      <div><dt>Referências</dt><dd>${c.referencias ? `<a href="${esc(c.referencias)}" target="_blank" rel="noopener noreferrer">${esc(c.referencias)}</a>` : 'Não informado'}</dd></div>
    </dl>

    <div class="contract-detail-actions">
      ${c.idServico ? `<a class="module-btn secondary" href="detalhe-servico.html?id=${esc(c.idServico)}"><i class="fas fa-eye"></i> Ver serviço</a>` : ''}
      <a class="module-btn secondary" href="contratos.html"><i class="fas fa-briefcase"></i> Ver contratos</a>
    </div>`;

    detailModal?.classList.add('is-open');
    detailModal?.setAttribute('aria-hidden', 'false');
  }

  function closeDetails() {
    detailModal?.classList.remove('is-open');
    detailModal?.setAttribute('aria-hidden', 'true');
  }

  conversationSearch?.addEventListener('input', () => {
    const termo = conversationSearch.value.trim().toLowerCase();
    filteredContratos = contratos.filter(c => {
      const outro = otherUser(c) || {};
      return [
        c.nomeServico,
        c.descricaoServico,
        outro.nome,
        statusLabel(c.status),
        conversationPreviews.get(getContractId(c))?.text
      ].some(value => String(value || '').toLowerCase().includes(termo));
    });
    renderConversationList();
  });

  document.querySelectorAll('[data-detail-close]').forEach(item => item.addEventListener('click', closeDetails));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDetails();
  });

  if (veioDoSinoMensagens) await limparNotificacoesDeMensagens();

  await loadContracts();

  refreshTimer = window.setInterval(() => {
    if (activeContrato) loadMessages();
  }, 30000);

  window.addEventListener('beforeunload', () => {
    if (refreshTimer) window.clearInterval(refreshTimer);
  });
});
