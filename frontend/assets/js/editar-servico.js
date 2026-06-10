document.addEventListener('DOMContentLoaded', async function() {
    const serviceId = new URLSearchParams(location.search).get('id');
    const user = await window.Workly.fetchCurrentUser(true);

    if (!window.Workly.getToken() || !user) {
        location.href = 'login.html';
        return;
    }

    if (!serviceId) {
        location.href = 'perfil.html';
        return;
    }

    const form = document.querySelector('.ad-form');
    const pageTitle = document.querySelector('.page-title');
    const categoryInput = document.getElementById('genero_servico');
    const nameInput = document.getElementById('adDescription');
    const descriptionInput = document.getElementById('serviceDetails');
    const extraInput = document.getElementById('serviceExtra');
    const priceInput = document.getElementById('servicePrice');
    const priceInputBox = document.querySelector('.price-input');
    const valorCombinarInput = document.querySelector('input[name="valorCombinar"], input[name="priceByContact"]');
    const coverImageInput = document.getElementById('coverImage');
    const uploadArea = document.getElementById('uploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const charCount = document.getElementById('charCount');
    const detailsCount = document.getElementById('detailsCount');
    const extraCount = document.getElementById('extraCount');
    const cancelBtn = document.querySelector('.draft-btn');
    const submitBtn = document.querySelector('.submit-btn');
    const previewCategory = document.getElementById('previewCategory');
    const previewTitle = document.getElementById('previewTitle');
    const previewDescription = document.getElementById('previewDescription');
    const previewPrice = document.getElementById('previewPrice');
    const defaultServiceImage = window.Workly?.defaultServiceImage || '../assets/img/servicos/servico_padrao.svg';

    const categories = {
        '1': { label: 'Design', titlePlaceholder: 'Ex: Identidade visual completa', descriptionPlaceholder: 'Ex: Criação de logo, paleta de cores, tipografia e kit visual para redes sociais.', pricePlaceholder: '980', extraPlaceholder: 'Ex: Inclui arquivos finais em PNG/JPG/PDF, 1 rodada de ajustes e entrega organizada em pasta. O cliente deve enviar briefing, referências e textos que entrarão nas peças.' },
        '2': { label: 'Programação', titlePlaceholder: 'Ex: Landing page profissional', descriptionPlaceholder: 'Ex: Criação de página responsiva com formulário, SEO básico e botão de contato.', pricePlaceholder: '750', extraPlaceholder: 'Ex: Inclui desenvolvimento do escopo combinado, testes básicos e 1 rodada de ajustes. O cliente deve enviar regras de negócio, referências, acessos e conteúdos necessários.' },
        '3': { label: 'Vídeo/Edição', titlePlaceholder: 'Ex: Pacote de cortes para podcast', descriptionPlaceholder: 'Ex: Cortes verticais com legenda e acabamento para TikTok, Reels e Shorts.', pricePlaceholder: '680', extraPlaceholder: 'Ex: Inclui até 5 cortes, legenda básica, tratamento simples e exportação em formato vertical. O cliente deve enviar o vídeo bruto e referências de estilo.' },
        '4': { label: 'Inteligência Artificial', titlePlaceholder: 'Ex: Chatbot com IA', descriptionPlaceholder: 'Ex: Configuração de chatbot para atendimento inicial e respostas frequentes.', pricePlaceholder: '1600', extraPlaceholder: 'Ex: Inclui configuração inicial, testes de fluxo e orientação de uso. O cliente deve enviar exemplos de perguntas, base de conhecimento e acessos necessários.' },
        '5': { label: 'Tradução/Escritor', titlePlaceholder: 'Ex: Artigos para blog com SEO', descriptionPlaceholder: 'Ex: Produção de artigos otimizados para ranqueamento, clareza e conversão.', pricePlaceholder: '620', extraPlaceholder: 'Ex: Inclui escrita ou revisão do texto, ajustes de clareza e 1 rodada de alterações. O cliente deve enviar objetivo, público, referências e materiais de apoio.' },
        '6': { label: 'Fotografia', titlePlaceholder: 'Ex: Fotografia de produtos', descriptionPlaceholder: 'Ex: Fotos para ecommerce, catálogo e redes sociais com edição básica.', pricePlaceholder: '720', extraPlaceholder: 'Ex: Inclui sessão ou tratamento conforme combinado, seleção das melhores imagens e edição básica. O cliente deve informar local, quantidade de produtos/pessoas e referências de estilo.' },
        '7': { label: 'Áudio/Música', titlePlaceholder: 'Ex: Edição de podcast', descriptionPlaceholder: 'Ex: Tratamento de áudio, cortes, vinheta e exportação para publicação.', pricePlaceholder: '480', extraPlaceholder: 'Ex: Inclui limpeza básica, equalização, cortes e exportação final. O cliente deve enviar o áudio bruto, roteiro se houver e referência de qualidade desejada.' }
    };

    function getCurrentCategory() {
        return categories[categoryInput?.value || ''];
    }

    function updateCounter(input, counter, max) {
        if (!input || !counter) return;
        counter.textContent = `${input.value.length}/${max}`;
    }

    function formatPrice(value) {
        const numberValue = Number(value);
        if (!Number.isFinite(numberValue) || numberValue <= 0) return 'Defina o preço';
        if (window.Workly?.formatCurrency) return window.Workly.formatCurrency(numberValue);
        return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function renderCoverPreview(src = defaultServiceImage, alt = 'Capa do serviço') {
        if (!imagePreview) return;
        imagePreview.innerHTML = `<img src="${src || defaultServiceImage}" alt="${alt}" onerror="this.src='${defaultServiceImage}'">`;
        imagePreview.classList.toggle('default-preview', !src || src === defaultServiceImage);
    }

    function updatePreview() {
        const currentCategory = getCurrentCategory();
        const title = nameInput?.value.trim();
        const description = descriptionInput?.value.trim();

        if (previewCategory) previewCategory.textContent = currentCategory?.label || 'Categoria';
        if (previewTitle) previewTitle.textContent = title || 'Título do anúncio';
        if (previewDescription) previewDescription.textContent = description || 'A descrição aparece aqui conforme você escreve.';
        if (previewPrice) previewPrice.textContent = valorCombinarInput?.checked ? 'Valor a combinar' : formatPrice(priceInput?.value);
    }

    function syncPlaceholders() {
        const currentCategory = getCurrentCategory();
        if (!currentCategory) return;

        if (nameInput && !nameInput.value.trim()) nameInput.placeholder = currentCategory.titlePlaceholder;
        if (descriptionInput && !descriptionInput.value.trim()) descriptionInput.placeholder = currentCategory.descriptionPlaceholder;
        if (extraInput && !extraInput.value.trim()) extraInput.placeholder = currentCategory.extraPlaceholder;
        if (priceInput && !priceInput.value && !valorCombinarInput?.checked) priceInput.placeholder = currentCategory.pricePlaceholder;
    }

    function syncPriceOptions() {
        if (!priceInput || !valorCombinarInput) return;

        if (valorCombinarInput.checked) {
            priceInput.value = '';
            priceInput.disabled = true;
            priceInput.required = false;
            priceInput.placeholder = 'Valor a combinar';
            priceInputBox?.classList.add('is-disabled');
        } else {
            priceInput.disabled = false;
            priceInput.required = true;
            priceInput.placeholder = getCurrentCategory()?.pricePlaceholder || '680';
            priceInputBox?.classList.remove('is-disabled');
        }

        updatePreview();
    }

    function refreshFormState() {
        updateCounter(nameInput, charCount, 70);
        updateCounter(descriptionInput, detailsCount, 420);
        updateCounter(extraInput, extraCount, 700);
        syncPlaceholders();
        syncPriceOptions();
        updatePreview();
    }

    uploadArea?.addEventListener('click', () => coverImageInput?.click());
    uploadArea?.addEventListener('dragover', (event) => {
        event.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea?.addEventListener('drop', (event) => {
        event.preventDefault();
        uploadArea.classList.remove('drag-over');
        const file = event.dataTransfer.files?.[0];
        if (!file || !coverImageInput) return;
        coverImageInput.files = event.dataTransfer.files;
        coverImageInput.dispatchEvent(new Event('change'));
    });
    coverImageInput?.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => renderCoverPreview(e.target.result, 'Nova capa');
        reader.readAsDataURL(file);
    });

    categoryInput?.addEventListener('change', refreshFormState);
    valorCombinarInput?.addEventListener('change', syncPriceOptions);
    priceInput?.addEventListener('input', updatePreview);
    nameInput?.addEventListener('input', () => {
        updateCounter(nameInput, charCount, 70);
        updatePreview();
    });
    descriptionInput?.addEventListener('input', () => {
        updateCounter(descriptionInput, detailsCount, 420);
        updatePreview();
    });
    extraInput?.addEventListener('input', () => updateCounter(extraInput, extraCount, 700));
    cancelBtn?.addEventListener('click', () => location.href = `detalhe-servico.html?id=${serviceId}`);

    try {
        if (pageTitle) pageTitle.textContent = 'Carregando anúncio...';

        const response = await window.Workly.apiFetch(`/api/servicos/${serviceId}`);
        const service = window.Workly.normalizeService(response.dados || response);

        if (String(service.idUsuario) !== String(user.idUsuario)) {
            await window.Workly.showAlert({
                icon: 'error',
                title: 'Acesso negado',
                text: 'Você só pode editar serviços criados por você.'
            });
            location.href = `detalhe-servico.html?id=${serviceId}`;
            return;
        }

        if (pageTitle) pageTitle.textContent = 'Editar anúncio';
        if (categoryInput) categoryInput.value = service.categoriaId || '';
        if (nameInput) nameInput.value = service.nome || '';
        if (descriptionInput) descriptionInput.value = service.descricao || '';
        if (extraInput) extraInput.value = service.extra || '';
        if (priceInput) priceInput.value = service.preco || '';
        if (valorCombinarInput) valorCombinarInput.checked = Boolean(service.valorCombinar);

        renderCoverPreview(service.imagemServico || defaultServiceImage);
        refreshFormState();
    } catch (error) {
        await window.Workly.showAlert({
            icon: 'error',
            title: 'Erro ao carregar',
            text: error.message || 'Não foi possível carregar o serviço.'
        });
        location.href = 'perfil.html';
    }

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        syncPriceOptions();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const oldButton = submitBtn?.innerHTML;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }

        const formData = new FormData(form);
        if (formData.get('genero_id') && !formData.get('categoriaId')) {
            formData.append('categoriaId', formData.get('genero_id'));
        }
        formData.set('precoNegociavel', 'false');
        formData.set('valorCombinar', valorCombinarInput?.checked ? 'true' : 'false');

        try {
            await window.Workly.apiFetch(`/api/servicos/${serviceId}`, {
                method: 'PUT',
                body: formData
            });

            await window.Workly.showAlert({
                icon: 'success',
                title: 'Serviço atualizado!',
                text: 'As alterações foram salvas com sucesso.'
            });
            location.href = `detalhe-servico.html?id=${serviceId}`;
        } catch (error) {
            window.Workly.showAlert({
                icon: 'error',
                title: 'Erro ao salvar',
                text: error.message || 'Não foi possível atualizar o serviço.'
            });
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = oldButton;
            }
        }
    });
});
