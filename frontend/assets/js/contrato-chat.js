// script para página de chat do contrato: le id do contrato, exibe resumo, carrega mensagens, lida com envio de novas mensagens e casos de erro

document.addEventListener('DOMContentLoaded', async () => {
  const contratoId = new URLSearchParams(location.search).get('id');
  const summary = document.getElementById('chatContractSummary');
  const messagesBox = document.getElementById('chatMessages');
  const form = document.getElementById('chatForm');
  const textarea = document.getElementById('chatText');
  const title = document.getElementById('chatRoomTitle');
  const subtitle = document.getElementById('chatRoomSubtitle');
  const statusLabel = document.getElementById('chatStatusLabel');

  if (!window.Workly.getToken()) {
    location.href = 'login.html';
    return;
  }

  if (!contratoId) {
    renderError('Contrato não informado', 'Volte para a página de contratos e abra o chat novamente.');
    return;
  }

  let contratoAtual = null;

  function esc(str) {
    return String(str ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function labelStatus(status = '') {
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

  function priceLabel(c) {
    if (c.tipoContratacao === 'combinar' && !c.preco && !c.precoProposto && !c.preco_proposto) {
      return 'Valor a combinar';
    }
    if (c.precoProposto || c.preco_proposto) {
      return `Proposta: ${window.Workly.formatCurrency(c.precoProposto || c.preco_proposto)}`;
    }
    return window.Workly.formatCurrency(c.preco || 0);
  }

  function renderError(titulo, mensagem) {
    if (summary) {
      summary.innerHTML = `<div class="empty-module"><i class="fas fa-triangle-exclamation"></i><h3>${esc(titulo)}</h3><p>${esc(mensagem)}</p><a href="contratos.html" class="module-btn primary">Voltar</a></div>`;
    }
    if (messagesBox) messagesBox.innerHTML = '';
    form?.classList.add('is-disabled');
  }

  async function carregarContrato() {
    const response = await window.Workly.apiFetch('/api/contratos/meus');
    const contratos = response.dados || [];
    const contrato = contratos.find(item => String(item.idContrato || item.id_contrato || item._id) === String(contratoId));

    if (!contrato) {
      renderError('Contrato não encontrado', 'Você não faz parte deste contrato ou ele não existe mais.');
      return null;
    }

    const statusBloqueado = ['cancelado', 'concluido', 'encerrado'].includes(contrato.status);
    if (statusBloqueado) {
      renderError('Chat indisponível', 'O chat fica disponível apenas enquanto o contrato está ativo.');
      return null;
    }

    contratoAtual = contrato;
    renderResumoContrato(contrato);
    return contrato;
  }

  function renderResumoContrato(c) {
    const outro = c.papel === 'cliente' ? c.freelancer : c.cliente;
    const status = labelStatus(c.status);
    const tipo = c.tipoContratacao === 'fixo'
      ? 'Preço fixo'
      : c.tipoContratacao === 'combinar'
        ? 'Valor a combinar'
        : 'Negociação';

    if (title) title.textContent = c.nomeServico || 'Contrato';
    if (subtitle) subtitle.textContent = `Conversa com ${outro?.nome || 'a outra parte'}`;
    if (statusLabel) {
      statusLabel.textContent = status;
      statusLabel.className = `module-pill status ${esc(c.status || '')}`;
    }

    summary.innerHTML = `<article class="module-card chat-summary-card">
      <img class="module-card-img" loading="lazy" decoding="async" src="${esc(c.imagemServico || '../assets/img/servicos/servico_padrao.svg')}" onerror="this.src='../assets/img/servicos/servico_padrao.svg'" alt="">
      <div class="module-card-body">
        <span class="module-pill status ${esc(c.status || '')}">${esc(status)}</span>
        <h3>${esc(c.nomeServico || 'Serviço')}</h3>
        <p>${esc(c.descricaoServico || 'Contrato criado pela plataforma Workly.').slice(0, 150)}</p>
        <div class="module-meta">
          <span class="module-pill"><i class="fas fa-user"></i>${esc(outro?.nome || 'Usuário')}</span>
          <span class="module-pill"><i class="fas fa-handshake"></i>${esc(tipo)}</span>
          <span class="module-pill price-pill"><i class="fas fa-money-bill-wave"></i>${esc(priceLabel(c))}</span>
        </div>
        <div class="module-actions">
          ${c.idServico ? `<a href="detalhe-servico.html?id=${esc(c.idServico)}" class="module-btn secondary"><i class="fas fa-eye"></i> Ver serviço</a>` : ''}
          <a href="contratos.html" class="module-btn secondary"><i class="fas fa-briefcase"></i> Ver contratos</a>
        </div>
      </div>
    </article>`;
  }

  async function carregarMensagens() {
    if (!messagesBox) return;
    messagesBox.innerHTML = window.Workly.loadingMarkup('Carregando mensagens...');

    try {
      const response = await window.Workly.apiFetch(`/api/mensagens/contrato/${contratoId}`);
      const mensagens = response.dados || [];

      messagesBox.innerHTML = mensagens.length
        ? mensagens.map(renderMensagem).join('')
        : '<div class="workly-chat-empty"><i class="fas fa-comments"></i><strong>Nenhuma mensagem ainda</strong><span>Envie a primeira mensagem para combinar detalhes do contrato.</span></div>';

      messagesBox.scrollTop = messagesBox.scrollHeight;
      await window.Workly.refreshNotificationBadge?.();
    } catch (error) {
      messagesBox.innerHTML = `<div class="workly-chat-empty error"><i class="fas fa-triangle-exclamation"></i><strong>Erro ao carregar mensagens</strong><span>${esc(error.message)}</span></div>`;
    }
  }

  function renderMensagem(m) {
    const user = m.remetente || {};
    const storedUser = window.Workly.getStoredUser?.() || {};
    const mine = String(user.idUsuario || user.id_usuario || '') === String(storedUser.idUsuario || storedUser.id_usuario || '');
    const time = m.createdAt
      ? new Date(m.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '';

    return `<article class="workly-chat-message ${mine ? 'mine' : 'theirs'}">
      <img src="${esc(user.fotoPerfil || '../assets/img/perfis/perfil_padrao.svg')}" onerror="this.src='../assets/img/perfis/perfil_padrao.svg'" alt="">
      <div>
        <div class="workly-chat-message-head">
          <strong>${esc(mine ? 'Você' : (user.nome || 'Usuário'))}</strong>
          <span>${esc(time)}</span>
        </div>
        <p>${esc(m.texto || '')}</p>
      </div>
    </article>`;
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!contratoAtual) return;

    const texto = String(textarea?.value || '').trim();
    if (!texto) return;

    const button = form.querySelector('button[type="submit"]');
    const old = button?.innerHTML;

    if (button) {
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    }

    try {
      await window.Workly.apiFetch('/api/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contratoId, texto })
      });

      if (textarea) textarea.value = '';
      await carregarMensagens();
    } catch (error) {
      messagesBox.insertAdjacentHTML('beforeend', `<div class="workly-chat-error">${esc(error.message || 'Não foi possível enviar a mensagem.')}</div>`);
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = old;
      }
    }
  });

  const contrato = await carregarContrato();
  if (contrato) await carregarMensagens();
});
