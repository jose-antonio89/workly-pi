// script para funcionalidades globais do frontend: tema, modais personalizados, formatação de dados, etc.

(function applyInitialTheme() {
    const isDark = localStorage.getItem('darkMode') === 'enabled';
    if (isDark) {
        document.documentElement.classList.add('dark-mode-enabled');
        document.body.classList.add('dark-mode');
    }
})();

function injectGlobalThemeStyles() {
    if (!document.querySelector('link[data-workly-theme="global"], link[href$="theme-global.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../assets/css/theme-global.css';
        link.setAttribute('data-workly-theme', 'global');
        document.head.appendChild(link);
    }
}

function updateThemeLogos() {
    const darkEnabled = localStorage.getItem('darkMode') === 'enabled';
    document.querySelectorAll('[data-logo-light][data-logo-dark]').forEach((logo) => {
        const nextLogo = darkEnabled ? logo.dataset.logoDark : logo.dataset.logoLight;
        if (nextLogo && logo.getAttribute('src') !== nextLogo) {
            logo.setAttribute('src', nextLogo);
        }
    });
}

// aplica o tema salvo no localstorage e atualiza o ícone do botão.
function applyThemeState() {
    const darkEnabled = localStorage.getItem('darkMode') === 'enabled';
    if (document.body) {
        document.body.classList.toggle('dark-mode', darkEnabled);
    }
    document.documentElement.classList.toggle('dark-mode-enabled', darkEnabled);
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        toggle.setAttribute('aria-label', darkEnabled ? 'Ativar modo claro' : 'Ativar modo escuro');
        toggle.innerHTML = `<i class="fas ${darkEnabled ? 'fa-sun' : 'fa-moon'}"></i>`;
    }
    updateThemeLogos();
}

// cria o botão de tema uma vez só, sem precisar repetir ele em todo html.
function ensureThemeToggle() {
    if (document.querySelector('.theme-toggle')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.addEventListener('click', () => {
        const enabled = localStorage.getItem('darkMode') === 'enabled';
        localStorage.setItem('darkMode', enabled ? 'disabled' : 'enabled');
        applyThemeState();
    });
    document.body.appendChild(button);
    applyThemeState();
}

function ensureWorklyModalRoot() {
    if (document.getElementById('workly-modal-root')) return document.getElementById('workly-modal-root');
    const modalRoot = document.createElement('div');
    modalRoot.id = 'workly-modal-root';
    document.body.appendChild(modalRoot);
    return modalRoot;
}

function getModalIcon(icon) {
    const icons = {
        success: 'fa-check',
        error: 'fa-xmark',
        warning: 'fa-exclamation',
        info: 'fa-info'
    };
    return icons[icon] || icons.info;
}

function closeCustomModal() {
    const root = document.getElementById('workly-modal-root');
    if (root) root.innerHTML = '';
}

function openCustomModal({ title = 'Aviso', text = '', icon = 'info', confirmText = 'OK' } = {}) {
    const root = ensureWorklyModalRoot();
    root.innerHTML = `
        <div class="wk-modal-overlay is-open">
            <div class="wk-modal-card" role="dialog" aria-modal="true" aria-label="${title}">
                <button type="button" class="wk-modal-close" aria-label="Fechar">
                    <i class="fas fa-xmark"></i>
                </button>
                <div class="wk-modal-icon wk-${icon}">
                    <i class="fas ${getModalIcon(icon)}"></i>
                </div>
                <h3 class="wk-modal-title">${title}</h3>
                <p class="wk-modal-text">${text}</p>
                <button type="button" class="wk-modal-button">${confirmText}</button>
            </div>
        </div>
    `;

    const overlay = root.querySelector('.wk-modal-overlay');
    const confirmButton = root.querySelector('.wk-modal-button');
    const closeButton = root.querySelector('.wk-modal-close');

    return new Promise((resolve) => {
        const finish = () => {
            closeCustomModal();
            resolve(true);
        };
        confirmButton?.addEventListener('click', finish);
        closeButton?.addEventListener('click', finish);
        overlay?.addEventListener('click', (event) => {
            if (event.target === overlay) finish();
        });
    });
}

function createSwalOptions({ title = 'Aviso', text = '', icon = 'info', confirmText = 'OK' } = {}) {
    const darkEnabled = localStorage.getItem('darkMode') === 'enabled';
    return {
        icon,
        title,
        text,
        confirmButtonText: confirmText,
        background: darkEnabled ? '#101826' : '#ffffff',
        color: darkEnabled ? '#eef5ff' : '#111827',
        allowOutsideClick: true,
        heightAuto: false,
        backdrop: 'rgba(4, 10, 20, 0.46)',
        showClass: { popup: 'workly-modal-enter' },
        hideClass: { popup: 'workly-modal-exit' },
        customClass: {
            container: 'workly-swal-container',
            popup: darkEnabled ? 'workly-swal-popup-dark workly-swal-popup' : 'workly-swal-popup-light workly-swal-popup',
            icon: 'workly-swal-icon',
            title: 'workly-swal-title',
            htmlContainer: 'workly-swal-text',
            confirmButton: 'workly-swal-confirm'
        },
        buttonsStyling: false
    };
}

function showAlert(options = {}) {
    if (typeof window.Swal !== 'undefined') {
        return window.Swal.fire(createSwalOptions(options));
    }
    return openCustomModal(options);
}

function showConfirm({ title = 'Confirmar ação', text = '', icon = 'warning', confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) {
    if (typeof window.Swal !== 'undefined') {
        const darkEnabled = localStorage.getItem('darkMode') === 'enabled';
        return window.Swal.fire({
            ...createSwalOptions({ title, text, icon, confirmText }),
            showCancelButton: true,
            cancelButtonText: cancelText,
            reverseButtons: true,
            cancelButtonColor: darkEnabled ? '#253247' : '#dbe4f0',
            customClass: {
                popup: darkEnabled ? 'workly-swal-popup-dark workly-swal-popup' : 'workly-swal-popup-light workly-swal-popup',
                title: 'workly-swal-title',
                htmlContainer: 'workly-swal-text',
                confirmButton: 'workly-swal-confirm',
                cancelButton: 'workly-swal-cancel'
            },
            buttonsStyling: false
        });
    }

    return new Promise((resolve) => {
        const confirmed = window.confirm(text || title);
        resolve({ isConfirmed: confirmed });
    });
}

function togglePassword(targetOrEvent, maybeButton) {
    let input = null;
    let button = null;

    if (typeof targetOrEvent === 'string') {
        input = document.getElementById(targetOrEvent);
        button = maybeButton || document.querySelector(`[data-password-target="${targetOrEvent}"]`);
    } else if (targetOrEvent?.currentTarget) {
        button = targetOrEvent.currentTarget;
        const targetId = button.getAttribute('data-password-target');
        input = targetId ? document.getElementById(targetId) : button.closest('.form-group')?.querySelector('input[type="password"], input[type="text"]');
    } else if (targetOrEvent?.nodeType === 1) {
        button = targetOrEvent;
        const targetId = button.getAttribute('data-password-target');
        input = targetId ? document.getElementById(targetId) : button.closest('.form-group')?.querySelector('input[type="password"], input[type="text"]');
    } else {
        input = document.getElementById('senha');
        button = document.querySelector('[data-password-target="senha"]') || document.querySelector('.password-toggle');
    }

    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    if (button) {
        const icon = button.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye', !isPassword);
            icon.classList.toggle('fa-eye-slash', isPassword);
        }
        button.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
    }
}

function initializePasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach((button) => {
        if (button.dataset.worklyBound === 'true') return;
        button.dataset.worklyBound = 'true';
        button.addEventListener('click', (event) => {
            event.preventDefault();
            togglePassword(event);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    injectGlobalThemeStyles();
    ensureThemeToggle();
    ensureWorklyModalRoot();
    initializePasswordToggles();
    applyThemeState();
});

window.togglePassword = togglePassword;

// endereço do backend.
// local: usa a api na porta 3000.
// fora do localhost: tenta usar o mesmo domínio; se hospedarem separado, é só trocar aqui.
window.API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : window.location.origin;

window.Workly = (() => {
    const DEFAULT_PROFILE_IMAGE = '../assets/img/perfis/perfil_padrao.svg';
    const DEFAULT_SERVICE_IMAGE = '../assets/img/servicos/servico_padrao.svg';

    function getToken() {
        return localStorage.getItem('token');
    }

    function setToken(token) {
        if (token) localStorage.setItem('token', token);
    }

    function clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    function logout(redirect = 'index.html') {
        clearSession();
        window.location.href = redirect;
    }

    function getStoredUser() {
        try {
            return normalizeUser(JSON.parse(localStorage.getItem('user')));
        } catch (_error) {
            return null;
        }
    }

    function setStoredUser(user) {
        if (!user) return;
        localStorage.setItem('user', JSON.stringify(normalizeUser(user)));
    }

    function getApiPayload(data) {
        if (Array.isArray(data?.dados)) return data.dados;
        if (data?.dados && typeof data.dados === 'object') return data.dados;
        return data;
    }

    function normalizeUser(user) {
        if (!user) return null;
        return {
            ...user,
            idUsuario: user.idUsuario || user.id_usuario || '',
            tipoConta: user.tipoConta || user.tipo_conta || '',
            areaAtuacao: user.areaAtuacao || user.area_atuacao || '',
            fotoPerfil: user.fotoPerfil || user.foto_perfil || DEFAULT_PROFILE_IMAGE,
            tituloProfissional: user.tituloProfissional || user.professional_title || '',
            localizacao: user.localizacao || user.location || '',
            site: user.site || user.website || ''
        };
    }

    function normalizeService(service) {
        if (!service) return null;
        return {
            ...service,
            idServico: service.idServico || service.id_servico || service.id,
            imagemServico: service.imagemServico || service.imagem_servico || DEFAULT_SERVICE_IMAGE,
            categoriaId: service.categoriaId || service.genero_id || null,
            nomeCategoria: service.nomeCategoria || service.nome_genero || '',
            idUsuario: service.idUsuario || service.id_usuario || null,
            nomeFreelancer: service.nomeFreelancer || service.nome_freelancer || '',
            fotoPerfil: service.fotoPerfil || service.foto_perfil || DEFAULT_PROFILE_IMAGE,
            precoNegociavel: false,
            valorCombinar: Boolean(service.valorCombinar || service.valor_combinar),
            avaliacaoMediaServico: Number(service.avaliacaoMediaServico ?? service.avaliacao_media_servico ?? service.mediaAvaliacoes ?? 0),
            totalAvaliacoesServico: Number(service.totalAvaliacoesServico ?? service.total_avaliacoes_servico ?? service.totalAvaliacoes ?? 0),
            createdAt: service.createdAt || service.created_at || null,
            updatedAt: service.updatedAt || service.updated_at || null
        };
    }

    async function parseResponse(response) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return response.json();
        }
        return response.text();
    }

        // wrapper do fetch: já coloca token, lê json/texto e trata erro num lugar só.
    async function apiFetch(path, options = {}) {
        const token = getToken();
        const headers = { ...(options.headers || {}) };
        if (token && !headers.Authorization) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${window.API_BASE}${path}`, {
            ...options,
            headers
        });

        const raw = await parseResponse(response);
        const message = raw?.mensagem || raw?.message || (typeof raw === 'string' ? raw : 'Erro na requisição.');

        if (!response.ok) {
            const error = new Error(message);
            error.response = response;
            error.data = raw;
            throw error;
        }

        return raw;
    }

    async function fetchCurrentUser(force = false) {
        const token = getToken();
        if (!token) return null;
        if (!force) {
            const stored = getStoredUser();
            if (stored) return stored;
        }

        try {
            const response = await apiFetch('/api/usuarios/perfil');
            const user = normalizeUser(response.user || response.dados?.user);
            setStoredUser(user);
            return user;
        } catch (error) {
            console.error('Erro ao carregar usuário atual:', error);
            if (error.response?.status === 401) {
                clearSession();
            }
            return getStoredUser();
        }
    }

    function formatCurrency(value) {
        return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
    }

    function escapeHtml(text = '') {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function parseDate(value) {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function isServiceNewToday(service) {
        const s = normalizeService(service);
        const created = parseDate(s?.createdAt);
        if (!created) return false;
        const now = new Date();
        return created.getFullYear() === now.getFullYear()
            && created.getMonth() === now.getMonth()
            && created.getDate() === now.getDate();
    }

    function formatServiceDate(service) {
        const s = normalizeService(service);
        const created = parseDate(s?.createdAt);
        return created
            ? created.toLocaleDateString('pt-BR')
            : '--/--/----';
    }

    // mantém o nome antigo para não quebrar páginas que já chamam essa função,
    // mas agora ela retorna data no formato dd/mm/yyyy em vez de horário.
    function formatServiceTime(service) {
        return formatServiceDate(service);
    }

    function formatServiceDateTime(service) {
        const s = normalizeService(service);
        const created = parseDate(s?.createdAt);
        return created ? created.toLocaleDateString('pt-BR') : 'Recentemente';
    }

    function formatServiceRating(service) {
        const s = normalizeService(service);
        const media = Number(s?.avaliacaoMediaServico || 0);
        const total = Number(s?.totalAvaliacoesServico || 0);
        if (total > 0 && media > 0) {
            return media.toFixed(1).replace('.', ',') + ' (' + total + ')';
        }
        return 'Sem avaliações';
    }

    function serviceCardMetaMarkup(service) {
        const s = normalizeService(service);
        const newBadge = isServiceNewToday(s) ? '<span class="service-new-badge">Novo</span>' : '';
        return `
            <div class="service-card-meta">
                <span class="service-rating-meta"><i class="fas fa-star"></i>${formatServiceRating(s)}</span>
                <span class="service-time-meta"><i class="far fa-calendar-alt"></i>${formatServiceTime(s)}</span>
                ${newBadge}
            </div>
        `;
    }

    function loadingMarkup(text = 'Carregando dados da Workly...') {
        return `<div class="workly-loading" role="status" aria-live="polite"><span class="workly-loader"></span><strong>${escapeHtml(text)}</strong><small>Preparando as informações para você.</small></div>`;
    }

    function serviceCardMarkup(service, variant = 'default') {
        const s = normalizeService(service);
        if (!s) return '';

        if (variant === 'modern') {
            return `
                <div class="servico-card-modern">
                    <div class="servico-card-modern-header">
                        <img src="${s.fotoPerfil}" alt="Foto do usuário" class="servico-card-modern-user-photo" loading="lazy" decoding="async" onerror="this.src='../assets/img/perfis/perfil_padrao.svg'">
                        <a class="servico-card-modern-user-name" href="perfil-publico.html?id=${s.idUsuario}" onclick="event.stopPropagation()">${escapeHtml(s.nomeFreelancer)}</a>
                    </div>
                    <img src="${s.imagemServico}" alt="Imagem do serviço" class="servico-card-modern-image" loading="lazy" decoding="async" onerror="this.src='../assets/img/servicos/servico_padrao.svg'">
                    <div class="servico-card-modern-content">
                        <span class="servico-card-modern-category">${escapeHtml(s.nomeCategoria)}</span>
                        <h3 class="servico-card-modern-title">${escapeHtml(s.nome)}</h3>
                        ${serviceCardMetaMarkup(s)}
                        <p class="servico-card-modern-price">${s.valorCombinar ? 'Valor a combinar' : formatCurrency(s.preco)}</p>
                        <div class="servico-card-modern-actions">
                            <button class="servico-card-modern-edit-button" onclick="window.location.href='detalhe-servico.html?id=${s.idServico}'">
                                <i class="fas fa-eye"></i> Ver detalhes
                            </button>
                            ${(variant === 'my-services' || variant === 'my-services-modern') ? `<button class="servico-card-modern-edit-button secondary" onclick="event.stopPropagation(); window.location.href='editar-servico.html?id=${s.idServico}'"><i class="fas fa-pen"></i> Editar</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="servico-card wk-service-card" onclick="window.location.href='detalhe-servico.html?id=${s.idServico}'">
                <div class="wk-service-image-wrap">
                    <img src="${s.imagemServico}" alt="Imagem do serviço" loading="lazy" decoding="async" class="card-img ${String(s.imagemServico).includes('servico_padrao.svg') ? 'is-default-service-image' : ''}" onerror="this.src='../assets/img/servicos/servico_padrao.svg'; this.classList.add('is-default-service-image')">
                    <span class="wk-service-category-badge">${escapeHtml(s.nomeCategoria)}</span>
                </div>

                <div class="wk-service-body">
                    <div class="wk-service-creator-line">
                        <img src="${s.fotoPerfil}" alt="Foto de ${escapeHtml(s.nomeFreelancer)}" loading="lazy" decoding="async" class="creator-img wk-service-avatar" onerror="this.src='../assets/img/perfis/perfil_padrao.svg'">
                        <a class="creator-name" href="perfil-publico.html?id=${s.idUsuario}" onclick="event.stopPropagation()">${escapeHtml(s.nomeFreelancer)}</a>
                    </div>

                    <h3 class="wk-service-title">${escapeHtml(s.nome)}</h3>
                    <p class="wk-service-desc">${escapeHtml(s.descricao)}</p>

                    ${serviceCardMetaMarkup(s)}

                    <div class="wk-service-price-row">
                        <div class="wk-service-price">
                            <small>Valor</small>
                            <strong>${s.valorCombinar ? 'Valor a combinar' : formatCurrency(s.preco)}</strong>
                        </div>
                        ${variant === 'my-services' ? `
                            <button type="button" class="wk-service-edit-button" onclick="event.stopPropagation(); window.location.href='editar-servico.html?id=${s.idServico}'">
                                <i class="fas fa-pen"></i>
                                Alterar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    return {
        getToken,
        setToken,
        clearSession,
        logout,
        getStoredUser,
        setStoredUser,
        getApiPayload,
        normalizeUser,
        normalizeService,
        apiFetch,
        fetchCurrentUser,
        formatCurrency,
        formatServiceRating,
        formatServiceTime,
        formatServiceDateTime,
        isServiceNewToday,
        serviceCardMetaMarkup,
        serviceCardMarkup,
        loadingMarkup,
        showAlert,
        showConfirm,
        updateThemeLogos,
        defaultProfileImage: DEFAULT_PROFILE_IMAGE,
        defaultServiceImage: DEFAULT_SERVICE_IMAGE
    };
})();
