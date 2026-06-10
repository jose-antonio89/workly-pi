// script para página de contratação de serviço: lê id do serviço, exibe resumo, lida com envio do formulário e casos de erro

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const serviceId = params.get('id');
  const preview = document.getElementById('servicePreview');
  const form = document.getElementById('hireDetailsForm');
  const cancel = document.getElementById('cancelHire');
  const details = document.getElementById('detalhesPedido');
  const counter = document.getElementById('detailsCounter');

  const escape = window.Workly?.escapeHtml || ((text = '') => String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;'));

  function priceLabel(service) {
    if (service.valorCombinar) return 'Valor a combinar';
    return window.Workly.formatCurrency(service.preco);
  }

  function ratingLabel(service) {
    return window.Workly.formatServiceRating
      ? window.Workly.formatServiceRating(service)
      : 'Sem avaliações';
  }

  function updateCounter() {
    if (!details || !counter) return;
    counter.textContent = `${details.value.length}/900`;
  }

  details?.addEventListener('input', updateCounter);
  updateCounter();

  if (!window.Workly.getToken()) {
    location.href = 'login.html';
    return;
  }

  if (!serviceId) {
    await window.Workly.showAlert({
      icon: 'error',
      title: 'Serviço não informado',
      text: 'Volte para a página do serviço e tente novamente.'
    });
    location.href = 'todos-servicos.html';
    return;
  }

  let service = null;
  try {
    if (preview) preview.innerHTML = window.Workly.loadingMarkup('Carregando resumo...');

    const response = await window.Workly.apiFetch(`/api/servicos/${serviceId}`);
    service = window.Workly.normalizeService(response.dados || response);

    if (preview) {
      const serviceImage = service.imagemServico || '../assets/img/servicos/servico_padrao.svg';
      preview.innerHTML = `
        <div class="hire-service-preview">
          <div class="hire-service-main">
            <div class="hire-service-image-wrap">
              <img src="${escape(serviceImage)}" alt="${escape(service.nome || 'Serviço')}" onerror="this.src='../assets/img/servicos/servico_padrao.svg'">
            </div>
            <div class="hire-service-info">
              <span class="hire-service-category">${escape(service.nomeCategoria || 'Serviço')}</span>
              <h3>${escape(service.nome || 'Serviço Workly')}</h3>
            </div>
          </div>

          <p class="hire-service-desc">${escape(service.descricao || service.descricaoServico || 'O freelancer receberá os detalhes informados nesta etapa para iniciar o trabalho com mais clareza.')}</p>

          <div class="hire-service-meta">
            <span><i class="fas fa-star"></i>${escape(ratingLabel(service))}</span>
            <span><i class="fas fa-user"></i>${escape(service.nomeFreelancer || 'Freelancer')}</span>
          </div>

          <div class="hire-price-row">
            <small>Valor do serviço</small>
            <strong>${escape(priceLabel(service))}</strong>
          </div>
        </div>
      `;
    }
  } catch (error) {
    await window.Workly.showAlert({
      icon: 'error',
      title: 'Erro ao carregar',
      text: error.message || 'Não foi possível carregar o serviço.'
    });
    location.href = 'todos-servicos.html';
    return;
  }

  cancel?.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.href = `detalhe-servico.html?id=${serviceId}`;
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const detalhesPedido = details?.value.trim() || '';
    if (detalhesPedido.length < 20) {
      window.Workly.showAlert({
        icon: 'warning',
        title: 'Detalhe um pouco mais',
        text: 'Escreva pelo menos 20 caracteres para o freelancer entender melhor o pedido.'
      });
      details?.focus();
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    const old = submit?.innerHTML;
    if (submit) {
      submit.disabled = true;
      submit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando contrato...';
    }

    try {
      const body = {
        servicoId: serviceId,
        detalhesPedido,
        prazoDesejado: document.getElementById('prazoDesejado')?.value.trim() || '',
        referencias: document.getElementById('referencias')?.value.trim() || ''
      };

      await window.Workly.apiFetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      await window.Workly.showAlert({
        icon: 'success',
        title: 'Contratação concluída!',
        text: 'Agora acompanhe o andamento na página de contratos.',
        confirmText: 'Ver contratos'
      });
      location.href = 'contratos.html';
    } catch (error) {
      window.Workly.showAlert({
        icon: 'error',
        title: 'Erro ao contratar',
        text: error.message || 'Não foi possível concluir a contratação.'
      });
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.innerHTML = old;
      }
    }
  });
});
