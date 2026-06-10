document.addEventListener('DOMContentLoaded', async function() {
    const user = await window.Workly.fetchCurrentUser(true);

    if (!window.Workly.getToken() || !user) {
        await window.Workly.showAlert({
            icon: 'warning',
            title: 'Faça login primeiro',
            text: 'Você precisa estar logado para publicar um anúncio.',
            confirmText: 'Ir para login'
        });
        window.location.href = 'login.html';
        return;
    }

    if (user.tipoConta !== 'Freelancer') {
        await window.Workly.showAlert({
            icon: 'error',
            title: 'Acesso restrito',
            text: 'Somente contas Freelancer podem publicar serviços.',
            confirmText: 'Ir para perfil'
        });
        window.location.href = 'perfil.html';
        return;
    }

    const profileImg = document.querySelector('.img-profile');
    if (profileImg) profileImg.src = user.fotoPerfil;

    const adForm = document.querySelector('.ad-form');
    const categoryInput = document.getElementById('genero_servico');
    const uploadArea = document.getElementById('uploadArea');
    const coverImageInput = document.getElementById('coverImage');
    const imagePreview = document.getElementById('imagePreview');
    const defaultServiceImage = window.Workly?.defaultServiceImage || '../assets/img/servicos/servico_padrao.svg';
    const priceInput = document.getElementById('servicePrice');
    const priceInputBox = document.querySelector('.price-input');
    const valorCombinarInput = document.querySelector('input[name="valorCombinar"]');
    const nameInput = document.getElementById('adDescription');
    const descriptionInput = document.getElementById('serviceDetails');
    const extraInput = document.getElementById('serviceExtra');
    const charCount = document.getElementById('charCount');
    const detailsCount = document.getElementById('detailsCount');
    const extraCount = document.getElementById('extraCount');
    const cancelBtn = document.querySelector('.draft-btn');
    const submitBtn = document.querySelector('.submit-btn');
    const previewCategory = document.getElementById('previewCategory');
    const previewTitle = document.getElementById('previewTitle');
    const previewDescription = document.getElementById('previewDescription');
    const previewPrice = document.getElementById('previewPrice');

    const categoryGuides = {
        '1': {
            label: 'Design',
            titleExample: 'Identidade visual completa',
            descriptionExample: 'Criação de logo, paleta de cores, tipografia e kit visual para redes sociais.',
            priceExample: '980',
            extraPlaceholder: 'Ex: Inclui arquivos finais em PNG/JPG/PDF, 1 rodada de ajustes e entrega organizada em pasta. O cliente deve enviar briefing, referências e textos que entrarão nas peças.'
        },
        '2': {
            label: 'Programação',
            titleExample: 'Landing page profissional',
            descriptionExample: 'Criação de página responsiva com formulário, SEO básico e botão de contato.',
            priceExample: '750',
            extraPlaceholder: 'Ex: Inclui desenvolvimento do escopo combinado, testes básicos e 1 rodada de ajustes. O cliente deve enviar regras de negócio, referências, acessos e conteúdos necessários.'
        },
        '3': {
            label: 'Vídeo/Edição',
            titleExample: 'Pacote de cortes para podcast',
            descriptionExample: 'Cortes verticais com legenda e acabamento para TikTok, Reels e Shorts.',
            priceExample: '680',
            extraPlaceholder: 'Ex: Inclui até 5 cortes, legenda básica, tratamento simples e exportação em formato vertical. O cliente deve enviar o vídeo bruto e referências de estilo.'
        },
        '4': {
            label: 'Inteligência Artificial',
            titleExample: 'Chatbot com IA',
            descriptionExample: 'Configuração de chatbot para atendimento inicial e respostas frequentes.',
            priceExample: '1600',
            extraPlaceholder: 'Ex: Inclui configuração inicial, testes de fluxo e orientação de uso. O cliente deve enviar exemplos de perguntas, base de conhecimento e acessos necessários.'
        },
        '5': {
            label: 'Tradução/Escritor',
            titleExample: 'Artigos para blog com SEO',
            descriptionExample: 'Produção de artigos otimizados para ranqueamento, clareza e conversão.',
            priceExample: '620',
            extraPlaceholder: 'Ex: Inclui escrita ou revisão do texto, ajustes de clareza e 1 rodada de alterações. O cliente deve enviar objetivo, público, referências e materiais de apoio.'
        },
        '6': {
            label: 'Fotografia',
            titleExample: 'Fotografia de produtos',
            descriptionExample: 'Fotos para ecommerce, catálogo e redes sociais com edição básica.',
            priceExample: '720',
            extraPlaceholder: 'Ex: Inclui sessão ou tratamento conforme combinado, seleção das melhores imagens e edição básica. O cliente deve informar local, quantidade de produtos/pessoas e referências de estilo.'
        },
        '7': {
            label: 'Áudio/Música',
            titleExample: 'Edição de podcast',
            descriptionExample: 'Tratamento de áudio, cortes, vinheta e exportação para publicação.',
            priceExample: '480',
            extraPlaceholder: 'Ex: Inclui limpeza básica, equalização, cortes e exportação final. O cliente deve enviar o áudio bruto, roteiro se houver e referência de qualidade desejada.'
        }
    };

    function getCurrentGuide() {
        return categoryGuides[categoryInput?.value || ''];
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

    function renderCoverPreview(src = defaultServiceImage, alt = 'Capa padrão do serviço') {
        if (!imagePreview) return;
        imagePreview.innerHTML = `<img src="${src}" alt="${alt}" onerror="this.src='${defaultServiceImage}'">`;
        imagePreview.classList.toggle('default-preview', src === defaultServiceImage);
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
            priceInput.placeholder = getCurrentGuide()?.priceExample || '680';
            priceInputBox?.classList.remove('is-disabled');
        }

        updatePreview();
    }

    function updateCategoryGuide() {
        const guide = getCurrentGuide();

        if (!guide) {
            if (nameInput && !nameInput.value.trim()) nameInput.placeholder = 'Ex: Pacote de cortes para podcast';
            if (descriptionInput && !descriptionInput.value.trim()) {
                descriptionInput.placeholder = 'Ex: Cortes verticais com legenda, cortes secos, trilha leve e acabamento para TikTok, Reels e Shorts.';
            }
            if (extraInput && !extraInput.value.trim()) {
                extraInput.placeholder = 'Ex: Inclui até 5 cortes, legenda básica, exportação em 1080x1920 e 1 rodada de ajustes. O cliente deve enviar o vídeo bruto e referências de estilo.';
            }
            syncPriceOptions();
            updatePreview();
            return;
        }

        if (nameInput && !nameInput.value.trim()) nameInput.placeholder = `Ex: ${guide.titleExample}`;
        if (descriptionInput && !descriptionInput.value.trim()) descriptionInput.placeholder = guide.descriptionExample;
        if (extraInput && !extraInput.value.trim()) extraInput.placeholder = guide.extraPlaceholder;

        syncPriceOptions();
        updatePreview();
    }

    function updatePreview() {
        const guide = getCurrentGuide();
        const title = nameInput?.value.trim();
        const description = descriptionInput?.value.trim();

        if (previewCategory) previewCategory.textContent = guide?.label || 'Categoria';
        if (previewTitle) previewTitle.textContent = title || 'Título do anúncio';
        if (previewDescription) previewDescription.textContent = description || 'A descrição aparece aqui conforme você escreve.';
        if (previewPrice) previewPrice.textContent = valorCombinarInput?.checked ? 'Valor a combinar' : formatPrice(priceInput?.value);
    }

    if (uploadArea && coverImageInput && imagePreview) {
        renderCoverPreview();

        uploadArea.addEventListener('click', () => coverImageInput.click());
        coverImageInput.addEventListener('change', function(event) {
            const file = event.target.files?.[0];
            if (!file) {
                renderCoverPreview();
                return;
            }

            const reader = new FileReader();
            reader.onload = (readerEvent) => renderCoverPreview(readerEvent.target.result, 'Preview da capa');
            reader.readAsDataURL(file);
        });
        uploadArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
        uploadArea.addEventListener('drop', (event) => {
            event.preventDefault();
            uploadArea.classList.remove('drag-over');
            const file = event.dataTransfer.files?.[0];
            if (!file) return;
            coverImageInput.files = event.dataTransfer.files;
            coverImageInput.dispatchEvent(new Event('change'));
        });
    }

    categoryInput?.addEventListener('change', updateCategoryGuide);
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
    cancelBtn?.addEventListener('click', () => {
        if (history.length > 1) history.back();
        else location.href = 'perfil.html#services';
    });

    updateCounter(nameInput, charCount, 70);
    updateCounter(descriptionInput, detailsCount, 420);
    updateCounter(extraInput, extraCount, 700);
    updateCategoryGuide();
    syncPriceOptions();
    updatePreview();

    if (adForm) {
        adForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            syncPriceOptions();

            if (!adForm.checkValidity()) {
                adForm.reportValidity();
                return;
            }

            const formData = new FormData(adForm);
            if (formData.get('genero_id') && !formData.get('categoriaId')) {
                formData.append('categoriaId', formData.get('genero_id'));
            }
            formData.set('precoNegociavel', 'false');

            const oldButton = submitBtn?.innerHTML;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
            }

            try {
                const response = await window.Workly.apiFetch('/api/servicos', {
                    method: 'POST',
                    body: formData
                });

                const servicoCriado = response?.dados || response?.servico || response;
                const servicoId = servicoCriado?.idServico || servicoCriado?._id || servicoCriado?.id;

                await window.Workly.showAlert({
                    icon: 'success',
                    title: 'Serviço publicado!',
                    text: 'Seu serviço foi criado com sucesso.',
                    confirmText: 'Ver serviço'
                });

                window.location.href = servicoId
                    ? `detalhe-servico.html?id=${servicoId}`
                    : 'perfil.html#services';
            } catch (error) {
                console.error('Erro ao criar serviço:', error);
                window.Workly.showAlert({
                    icon: 'error',
                    title: 'Erro ao publicar',
                    text: error.message || 'Ocorreu um erro ao criar o serviço.',
                    confirmText: 'Fechar'
                });
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = oldButton;
                }
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(event) {
            event.preventDefault();
            window.Workly.logout('index.html');
        });
    }
});
