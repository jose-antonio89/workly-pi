/* script para página de detalhe do serviço: lê id do serviço, busca dados via api, exibe detalhes,
 lida com ações como favoritar, contratar, enviar proposta e casos de erro */

document.addEventListener('DOMContentLoaded', async function () {
    const serviceId = new URLSearchParams(window.location.search).get('id');
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);
    const selectors = {
        title: $('.service-title'), price: $('.service-price'), priceHelper: $('.price-helper'), summary: $('.service-summary'), mainImage: $('.service-main-image'),
        categoryBadge: $('.service-category-badge'), freelancerAvatar: $('.freelancer-avatar-small'), freelancerName: $('.freelancer-name'),
        freelancerSubtitle: $('.freelancer-subtitle'), freelancerRating: $('.freelancer-rating'), description: $('.service-description'),
        extraSection: $('.service-extra-section'), extra: $('.service-extra'), infoCategory: $('.info-category'), infoCreated: $('.info-created'),
        infoSeller: $('.info-seller'), sellerAvatar: $('.seller-avatar'), sellerName: $('.seller-name'), sellerRole: $('.seller-role'),
        sellerRating: $('.seller-rating'), sellerCategory: $('.seller-category'), purchaseBtns: $$('.btn-purchase'), contactBtns: $$('.btn-contact, .btn-contact-secondary'),
        favoriteBtns: $$('.btn-favorite'), copyBtn: $('.btn-copy-link'), editContainer: $('#edit-button-container')
    };
    if (!serviceId) return showServiceError('Serviço não informado', 'Não encontramos o identificador do serviço na URL.');
    const currentUser = await window.Workly.fetchCurrentUser(true).catch(() => null);
    try {
        const response = await window.Workly.apiFetch(`/api/servicos/${serviceId}`);
        const raw = response.dados || response;
        const service = window.Workly.normalizeService(raw);
        renderService(service, raw, currentUser);
        bindActions(service, raw, currentUser);
    } catch (error) { showServiceError('Serviço não encontrado', error.message || 'Não foi possível carregar este serviço.'); }

    function renderService(service, raw, currentUser) {
        const name = service.nome || 'Serviço sem título';
        const category = service.nomeCategoria || 'Categoria não informada';
        const seller = service.nomeFreelancer || 'Freelancer Workly';
        const photo = service.fotoPerfil || window.Workly.defaultProfileImage;
        const description = raw.descricao || service.descricao || 'O freelancer ainda não adicionou uma descrição para este serviço.';
        setText(selectors.title, name);
        setText(selectors.price, formatServicePrice(raw, service));
        setText(selectors.priceHelper, (raw.valorCombinar || service.valorCombinar) ? 'Envie uma proposta para combinar escopo, prazo e valor.' : 'Confirme o escopo antes de finalizar a contratação.');
        setText(selectors.summary, buildServiceSummary(description, seller, category));
        setText(selectors.freelancerName, seller); setText(selectors.freelancerSubtitle, category); setRating(raw, service);
        setText(selectors.description, description);
        setText(selectors.infoCategory, category); setText(selectors.infoCreated, window.Workly.formatServiceDateTime(service)); setText(selectors.infoSeller, seller);
        setText(selectors.sellerName, seller); setText(selectors.sellerRole, `Freelancer de ${category}`); setText(selectors.sellerCategory, category);
        setText(selectors.sellerRating, serviceRatingText(raw, service));
        if (selectors.mainImage) { selectors.mainImage.src = service.imagemServico || '../assets/img/servicos/servico_padrao.svg'; selectors.mainImage.alt = `Imagem do serviço ${name}`; selectors.mainImage.onerror = () => selectors.mainImage.src = '../assets/img/servicos/servico_padrao.svg'; }
        [selectors.freelancerAvatar, selectors.sellerAvatar].forEach(img => { if (img) { img.src = photo; img.onerror = () => img.src = window.Workly.defaultProfileImage; } });
        if (selectors.categoryBadge && service.categoriaId) { const a = document.createElement('a'); a.href = `categorias.html?id=${encodeURIComponent(service.categoriaId)}`; a.textContent = category; a.className = 'service-category-badge'; selectors.categoryBadge.replaceWith(a); selectors.categoryBadge = a; }
        if ((raw.extra || service.extra) && selectors.extraSection && selectors.extra) { selectors.extraSection.hidden = false; setText(selectors.extra, raw.extra || service.extra); }
        document.title = `Workly - ${name}`;
        const isOwner = currentUser && String(currentUser.idUsuario) === String(service.idUsuario);
        if (isOwner && selectors.editContainer) selectors.editContainer.innerHTML = `<a href="editar-servico.html?id=${service.idServico || serviceId}" class="btn-edit"><i class="fas fa-pen"></i>Editar serviço</a>`;
        renderFavoriteState(service.idServico || serviceId);
    }

    function bindActions(service, raw = {}, currentUser) {
        const isOwner = currentUser && String(currentUser.idUsuario) === String(service.idUsuario);
        const isProposalService = Boolean(service.valorCombinar || raw.valorCombinar);
        selectors.purchaseBtns.forEach(btn => {
            btn.innerHTML = isProposalService
                ? '<i class="fas fa-paper-plane"></i> Enviar proposta'
                : '<i class="fas fa-shopping-cart"></i> Continuar contratação';
        });
        selectors.contactBtns.forEach(btn => btn.addEventListener('click', () => showDetailToast('Mensagem em breve', 'O chat será integrado em uma próxima etapa.', 'info')));
        selectors.purchaseBtns.forEach(btn => btn.addEventListener('click', async () => {
            if (!currentUser) { showDetailToast('Login necessário', 'Entre na sua conta para continuar.', 'info'); setTimeout(() => location.href='login.html', 900); return; }
            if (isOwner) return showDetailToast('Este serviço é seu', 'Use o perfil para gerenciar o anúncio.', 'info');
            if (service.valorCombinar || raw.valorCombinar) {
                location.href = `negociar-servico.html?id=${encodeURIComponent(service.idServico || serviceId)}`;
                return;
            }
            location.href = `contratar-servico.html?id=${encodeURIComponent(service.idServico || serviceId)}`;
        }));
        selectors.favoriteBtns.forEach(btn => btn.addEventListener('click', () => toggleFavorite(service.idServico || serviceId))); 
        selectors.copyBtn?.addEventListener('click', copyCurrentLink);
    }

    async function renderFavoriteState(id) {
        if (!selectors.favoriteBtns || !selectors.favoriteBtns.length) return;
        const setButtons = (saved) => {
            selectors.favoriteBtns.forEach(btn => {
                btn.classList.toggle('is-saved', saved);
                btn.innerHTML = saved
                    ? '<i class="fas fa-heart"></i><span>Salvo nos favoritos</span>'
                    : '<i class="far fa-heart"></i><span>Salvar nos favoritos</span>';
            });
        };
        if (!window.Workly.getToken()) { setButtons(false); return; }
        try {
            const r = await window.Workly.apiFetch(`/api/favoritos/servico/${id}`);
            setButtons(Boolean((r.dados || r).favoritado));
        } catch { setButtons(false); }
    }

    async function toggleFavorite(id) {
        if (!window.Workly.getToken()) { showDetailToast('Login necessário', 'Entre para salvar favoritos.', 'info'); setTimeout(() => location.href='login.html', 900); return; }
        const saved = Array.from(selectors.favoriteBtns || []).some(btn => btn.classList.contains('is-saved'));
        selectors.favoriteBtns.forEach(btn => btn.disabled = true);
        try {
            if (saved) await window.Workly.apiFetch(`/api/favoritos/servico/${id}`, { method:'DELETE' });
            else await window.Workly.apiFetch('/api/favoritos', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ servicoId:id }) });
            await renderFavoriteState(id);
            showDetailToast(saved?'Removido dos favoritos':'Serviço salvo', saved?'Removido com sucesso.':'Acesse pela página Favoritos.', saved?'info':'success');
        } catch(e){ showDetailToast('Erro nos favoritos', e.message || 'Não foi possível atualizar.', 'info'); }
        finally { selectors.favoriteBtns.forEach(btn => btn.disabled = false); }
    }

    function formatServicePrice(raw={}, service={}) { if (raw.valorCombinar || service.valorCombinar) return 'Valor a combinar'; const preco = raw.preco ?? service.preco; return window.Workly.formatCurrency(preco || 0); }

    function freelancerRatingData(raw={}, service={}) { const m = raw.avaliacaoMediaFreelancer ?? raw.avaliacao_media_freelancer ?? service.avaliacaoMediaFreelancer ?? 0; const t = raw.totalAvaliacoesFreelancer ?? raw.total_avaliacoes_freelancer ?? service.totalAvaliacoesFreelancer ?? 0; return { media:Number(m)||0, total:Number(t)||0 }; }

    function serviceRatingData(raw={}, service={}) { const m = raw.avaliacaoMediaServico ?? raw.avaliacao_media_servico ?? service.avaliacaoMediaServico ?? service.mediaAvaliacoes ?? 0; const t = raw.totalAvaliacoesServico ?? raw.total_avaliacoes_servico ?? service.totalAvaliacoesServico ?? service.totalAvaliacoes ?? 0; return { media:Number(m)||0, total:Number(t)||0 }; }

    function serviceRatingText(raw, service) { const r=serviceRatingData(raw, service); if (r.total && r.media) return r.media.toFixed(1).replace('.', ',') + ' (' + r.total + ')'; return 'Sem avaliações'; }

    function setRating(raw, service) { if (!selectors.freelancerRating) return; const r=freelancerRatingData(raw, service); selectors.freelancerRating.innerHTML = (!r.total||!r.media) ? '<i class="fas fa-star"></i> Sem avaliações ainda' : '<i class="fas fa-star"></i> ' + r.media.toFixed(1).replace('.', ',') + ' • ' + r.total + ' avaliações'; }

    function setText(el, val) { if (el) el.textContent = val || '--'; }

    function buildServiceSummary(description, seller, category) {
        const cleanDescription = String(description || '').replace(/\s+/g, ' ').trim();
        if (cleanDescription && !cleanDescription.startsWith('O freelancer ainda')) {
            return cleanDescription.length > 170 ? cleanDescription.slice(0, 167).trim() + '...' : cleanDescription;
        }
        return `${seller} publicou este serviço na categoria ${category}. Confira a descrição e combine os detalhes antes de contratar.`;
    }

    async function copyCurrentLink() { try { await navigator.clipboard.writeText(location.href); showDetailToast('Link copiado', 'Link copiado para a área de transferência.', 'success'); } catch { showDetailToast('Não foi possível copiar', 'Copie pela barra do navegador.', 'info'); } }

    function showServiceError(title, message) { const main = document.querySelector('.service-page'); if (main) main.innerHTML = `<div class="container"><div class="error-state card-surface"><i class="fas fa-circle-exclamation"></i><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><a href="todos-servicos.html" class="btn btn-primary" style="display:inline-flex;width:auto;padding:0 26px;">Ver outros serviços</a></div></div>`; }

    function showDetailToast(title, message, type='success') { let toast = document.querySelector('.detail-toast'); if (!toast) { toast=document.createElement('div'); toast.className='detail-toast'; document.body.appendChild(toast); } toast.className=`detail-toast detail-toast-${type}`; toast.innerHTML=`<div class="detail-toast-icon"><i class="fas ${type==='success'?'fa-check':'fa-info'}"></i></div><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span></div>`; clearTimeout(window.__worklyDetailToastTimer); requestAnimationFrame(()=>toast.classList.add('is-visible')); window.__worklyDetailToastTimer=setTimeout(()=>toast.classList.remove('is-visible'),2600); }

    function escapeHtml(t='') { return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
});
