/* script para página de contratos: carrega contratos do usuário, separa entre "contratei" e 
"me contrataram", exibe em seções com resumo e ações possíveis, lida com abertura de chat,
 avalição e ações como aceitar ou cancelar contrato. Também lida com casos de erro e estados vazios */

document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('contratos-list');
  if (!window.Workly.getToken()) { location.href = 'login.html'; return; }

  const params = new URLSearchParams(location.search);
  const veioDoSinoContratos = params.get('notificacoes') === 'contratos';

  async function limparNotificacoesDeContratos() {
    try {
      await window.Workly.apiFetch('/api/notificacoes/contexto/lidas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contexto: 'contratos', referenciaId: params.get('contrato') || undefined })
      });
      await window.Workly.refreshNotificationBadge?.();
    } catch (error) {
      console.error('Erro ao limpar notificações de contratos:', error);
    }
  }

  const toast = (msg) => {
    let t = document.querySelector('.module-toast');
    if (!t) { t = document.createElement('div'); t.className = 'module-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__mt);
    window.__mt = setTimeout(() => t.classList.remove('show'), 2200);
  };

  // carrega os contratos e separa em duas listas: o que eu contratei e o que contrataram comigo.
  // carrega contratos e separa entre contratei e me contrataram.
async function load() {
    list.innerHTML = window.Workly.loadingMarkup('Carregando contratos...');
    try {
      const res = await window.Workly.apiFetch('/api/contratos/meus');
      const contratos = res.dados || [];
      if (!contratos.length) {
        list.innerHTML = '<div class="empty-module"><i class="fas fa-briefcase"></i><h3>Nenhum contrato ainda</h3><p>Quando você contratar ou receber um serviço, ele aparecerá aqui.</p><a class="module-btn primary" href="todos-servicos.html">Explorar serviços</a></div>';
        return;
      }

      const contratados = contratos.filter(c => c.papel === 'cliente');
      const recebidos = contratos.filter(c => c.papel === 'freelancer');

      list.innerHTML = `
        ${section('Contratei', 'Serviços comprados por você. Acompanhe propostas, entregas e avaliações.', 'fa-cart-shopping', contratados, 'contratados')}
        ${section('Me contrataram', 'Propostas e trabalhos recebidos dos seus clientes.', 'fa-handshake', recebidos, 'recebidos')}
      `;
      bind();
    } catch (e) {
      list.innerHTML = `<div class="empty-module"><i class="fas fa-triangle-exclamation"></i><h3>Erro ao carregar</h3><p>${esc(e.message)}</p></div>`;
    }
  }

  function section(titulo, subtitulo, icon, items, tipo) {
    const vazio = tipo === 'contratados'
      ? '<p>Você ainda não contratou nenhum serviço.</p><a class="module-btn primary" href="todos-servicos.html">Explorar serviços</a>'
      : '<p>Você ainda não recebeu propostas ou contratações.</p><a class="module-btn secondary" href="anuncio.html">Publicar serviço</a>';

    return `<section class="wk-contract-section is-open wk-contract-section-${tipo}" data-contract-section="${tipo}">
      <button class="wk-contract-toggle" type="button" data-contract-toggle="${tipo}" aria-expanded="true">
        <span class="wk-contract-icon"><i class="fas ${icon}"></i></span>
        <span class="wk-contract-title">
          <strong>${titulo}</strong>
          <small>${subtitulo}</small>
        </span>
        <span class="wk-contract-count">${items.length}</span>
        <span class="wk-contract-chevron" aria-hidden="true"><i class="fas fa-chevron-down"></i></span>
      </button>
      <div class="wk-contract-panel" data-contract-panel>
        <div class="wk-contract-panel-inner">
          ${items.length
            ? `<div class="module-grid contracts-grid">${items.map(card).join('')}</div>`
            : `<div class="empty-module section-empty">${vazio}</div>`
          }
        </div>
      </div>
    </section>`;
  }

  // monta cada card de contrato.
// o botão de chat só aparece quando o contrato ainda está ativo.
function card(c) {
    const outro = c.papel === 'cliente' ? c.freelancer : c.cliente;
    const podeAvaliar = c.papel === 'cliente' && c.status === 'concluido' && !c.jaAvaliado && !c.ja_avaliado;
    const roleLabel = c.papel === 'cliente' ? 'Você contratou' : 'Você recebeu';
    const statusLabel = labelStatus(c.status);
    const podeConversar = !['concluido', 'cancelado', 'encerrado'].includes(c.status);
    return `<article class="module-card contract-card ${c.papel === 'cliente' ? 'is-client' : 'is-freelancer'}">
      <img class="module-card-img" loading="lazy" decoding="async" src="${c.imagemServico || '../assets/img/servicos/servico_padrao.svg'}" onerror="this.src='../assets/img/servicos/servico_padrao.svg'" alt="">
      <div class="module-card-body">
        <div class="contract-title-row">
          <h3>${esc(c.nomeServico)}</h3>
          <span class="module-pill status ${esc(c.status)}">${esc(statusLabel)}</span>
        </div>
        <p>${esc(c.descricaoServico || 'Contrato criado pela plataforma Workly.').slice(0, 115)}</p>
        <div class="module-meta">
          <span class="module-pill"><i class="fas fa-user"></i>${esc(outro?.nome || 'Usuário')}</span>
          <span class="module-pill"><i class="fas fa-id-badge"></i>${roleLabel}</span>
          <span class="module-pill price-pill">${priceLabel(c)}</span>
          ${c.tipoContratacao && c.tipoContratacao !== 'fixo' ? `<span class="module-pill"><i class="fas fa-handshake"></i>${c.tipoContratacao === 'combinar' ? 'Valor a combinar' : 'Negociação'}</span>` : ''}
        </div>
        ${c.mensagem ? `<div class="contract-message"><strong>Mensagem:</strong> ${esc(c.mensagem)}</div>` : ''}
        <div class="module-actions">
          ${c.idServico ? `<a class="module-btn secondary" href="detalhe-servico.html?id=${c.idServico}">Ver serviço</a>` : ''}
          ${podeConversar ? `<a class="module-btn secondary chat-btn" href="mensagens.html?contrato=${c.idContrato}"><i class="fas fa-comments"></i> Chat</a>` : ''}
          ${actionsFor(c)}
          ${podeAvaliar ? avaliarForm(c) : feedbackContrato(c)}
        </div>
      </div>
    </article>`;
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
    if (c.tipoContratacao === 'combinar' && !c.preco && !c.precoProposto && !c.preco_proposto) return '<i class="fas fa-comments-dollar"></i> Valor a combinar';
    if (c.precoProposto || c.preco_proposto) return `<i class="fas fa-hand-holding-dollar"></i> Proposta: ${window.Workly.formatCurrency(c.precoProposto || c.preco_proposto)}`;
    return `<i class="fas fa-money-bill-wave"></i> ${window.Workly.formatCurrency(c.preco || 0)}`;
  }

  // decide quais botões aparecem dependendo do papel do usuário e status do contrato.
  // decide quais ações aparecem dependendo do papel do usuário e do status do contrato.
function actionsFor(c) {
    if (['concluido', 'cancelado', 'encerrado'].includes(c.status)) return '';

    if (c.papel === 'freelancer') {
      if (c.status === 'proposta_pendente') {
        return `<button class="module-btn primary" data-action="aceitar" data-id="${c.idContrato}"><i class="fas fa-check"></i> Aceitar proposta</button>
                <button class="module-btn danger" data-action="recusar" data-id="${c.idContrato}"><i class="fas fa-xmark"></i> Recusar</button>`;
      }
      if (c.status === 'pendente') {
        return `<button class="module-btn primary" data-action="aceitar" data-id="${c.idContrato}"><i class="fas fa-play"></i> Aceitar/Iniciar</button>
                <button class="module-btn danger" data-action="cancelar" data-id="${c.idContrato}"><i class="fas fa-xmark"></i> Cancelar</button>`;
      }
      if (c.status === 'proposta_aceita') {
        return `<button class="module-btn primary" data-action="iniciar" data-id="${c.idContrato}"><i class="fas fa-play"></i> Iniciar trabalho</button>
                <button class="module-btn primary" data-action="entregar" data-id="${c.idContrato}"><i class="fas fa-check"></i> Finalizar entrega</button>
                <button class="module-btn danger" data-action="cancelar" data-id="${c.idContrato}"><i class="fas fa-xmark"></i> Cancelar</button>`;
      }
      if (c.status === 'em_andamento') {
        return `<button class="module-btn primary" data-action="entregar" data-id="${c.idContrato}"><i class="fas fa-check"></i> Finalizar entrega</button>
                <button class="module-btn danger" data-action="cancelar" data-id="${c.idContrato}"><i class="fas fa-xmark"></i> Cancelar</button>`;
      }
    }

    if (['pendente', 'proposta_pendente', 'proposta_aceita'].includes(c.status)) {
      return `<button class="module-btn danger" data-action="cancelar" data-id="${c.idContrato}"><i class="fas fa-xmark"></i> Cancelar contratação</button>`;
    }
    return '';
  }

  function avaliarForm(c) {
    return `<form class="rating-form" data-review="${c.idContrato}"><div class="rating-row"><label>Nota do serviço</label><input type="number" min="1" max="5" value="5" name="notaServico"></div><div class="rating-row"><label>Nota do freelancer</label><input type="number" min="1" max="5" value="5" name="notaFreelancer"></div><textarea name="comentario" placeholder="Comentário sobre a experiência"></textarea><button class="module-btn primary" type="submit"><i class="fas fa-star"></i>Enviar avaliação</button></form>`;
  }

  function feedbackContrato(c) {
    if (c.papel === 'cliente' && (c.status === 'encerrado' || c.jaAvaliado || c.ja_avaliado)) {
      return '<div class="rating-closed"><i class="fas fa-circle-check"></i> Avaliação enviada. Contrato encerrado.</div>';
    }
    if (c.papel === 'freelancer' && c.status === 'encerrado') {
      return '<div class="rating-closed freelancer-closed"><i class="fas fa-circle-check"></i> Serviço avaliado pelo contratante.</div>';
    }
    if (c.papel === 'cliente' && c.status === 'concluido') {
      return '<div class="contract-tip"><i class="fas fa-star"></i> Avalie para encerrar este contrato.</div>';
    }
    if (c.papel === 'cliente' && c.status === 'proposta_pendente') {
      return '<div class="contract-tip"><i class="fas fa-clock"></i> Aguardando resposta do freelancer.</div>';
    }
    return '';
  }

  function bind() {
    setupAccordions();

    list.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        await window.Workly.apiFetch(`/api/contratos/${btn.dataset.id}/${btn.dataset.action}`, { method: 'POST' });
        toast('Contrato atualizado');
        load();
      } catch (e) { toast(e.message); }
    }));

    list.querySelectorAll('[data-review]').forEach(form => form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const fd = new FormData(form);
      try {
        await window.Workly.apiFetch('/api/avaliacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contratoId: form.dataset.review, notaServico: fd.get('notaServico'), notaFreelancer: fd.get('notaFreelancer'), comentario: fd.get('comentario') }) });
        toast('Avaliação enviada');
        load();
      } catch (e) { toast(e.message); }
    }));
  }

  // abre/fecha as seções de contratos sem recarregar a página.
  function setupAccordions() {
    list.querySelectorAll('[data-contract-toggle]').forEach(btn => {
      const section = btn.closest('.wk-contract-section');
      const panel = section?.querySelector('[data-contract-panel]');
      const inner = panel?.querySelector('.wk-contract-panel-inner');
      if (!section || !panel || !inner) return;

      section.classList.add('is-open');
      section.classList.remove('is-collapsed');
      btn.setAttribute('aria-expanded', 'true');
      panel.style.overflow = 'hidden';
      panel.style.maxHeight = 'none';
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';

      btn.addEventListener('click', () => {
        const isOpen = section.classList.contains('is-open');
        if (isOpen) closeAccordion(section, btn, panel);
        else openAccordion(section, btn, panel, inner);
      });
    });
  }

  function openAccordion(section, btn, panel, inner) {
    section.classList.add('is-open');
    section.classList.remove('is-collapsed');
    btn.setAttribute('aria-expanded', 'true');
    panel.style.maxHeight = `${inner.scrollHeight}px`;
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
    window.setTimeout(() => {
      if (section.classList.contains('is-open')) panel.style.maxHeight = 'none';
    }, 260);
  }

  function closeAccordion(section, btn, panel) {
    panel.style.maxHeight = `${panel.scrollHeight}px`;
    panel.offsetHeight;
    section.classList.remove('is-open');
    section.classList.add('is-collapsed');
    btn.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0px';
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(-6px)';
  }

  function esc(str) {
    return String(str ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  if (veioDoSinoContratos) await limparNotificacoesDeContratos();

  load();
});
