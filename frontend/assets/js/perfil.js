document.addEventListener('DOMContentLoaded', function() {
    if (!window.Workly.getToken()) {
        window.location.href = 'login.html';
        return;
    }

    const profileElements = {
        name: document.querySelector('.profile-name'),
        title: document.querySelector('.profile-title'),
        // esse texto aparece no card principal do perfil, tipo uma mini apresentação do freelancer.
        bioPreview: document.getElementById('profile-bio-preview'),
        avatar: document.querySelector('.profile-avatar'),
        currentPhoto: document.querySelector('.current-photo'),
        modalPhotoPreview: document.querySelector('.modal-photo-preview'),
        memberSince: document.getElementById('member-since'),
        headerServicesCount: document.getElementById('header-services-count'),
        headerAccountType: document.getElementById('header-account-type'),
        headerArea: document.getElementById('header-area'),
        overviewServicesCount: document.getElementById('overview-services-count'),
        overviewAccountType: document.getElementById('overview-account-type'),
        overviewArea: document.getElementById('overview-area'),
        overviewRating: document.getElementById('overview-rating'),
        overviewContractsCount: document.getElementById('overview-contracts-count'),
        overviewProposalsCount: document.getElementById('overview-proposals-count'),
        firstName: document.getElementById('first-name'),
        lastName: document.getElementById('last-name'),
        professionalTitle: document.getElementById('professional-title'),
        bio: document.getElementById('bio'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        location: document.getElementById('location'),
        website: document.getElementById('website'),
        linkedin: document.getElementById('linkedin'),
        github: document.getElementById('github'),
        instagram: document.getElementById('instagram'),
        portfolioTitle: document.getElementById('portfolio-title'),
        portfolioDescription: document.getElementById('portfolio-description'),
        portfolioUrl: document.getElementById('portfolio-url'),
        availability: document.getElementById('availability'),
        hourPrice: document.getElementById('hour-price'),
        accountType: document.getElementById('account-type'),
        accountArea: document.getElementById('account-area'),
        accountAreaWrapper: document.getElementById('account-area-wrapper'),
        currentAccountTypeLabel: document.getElementById('current-account-type-label'),
        accountTypeHelp: document.getElementById('account-type-help'),
        paymentMethod: document.getElementById('payment-method'),
        pixKey: document.getElementById('pix-key'),
        bankInfo: document.getElementById('bank-info'),
        notifyEmail: document.getElementById('notify-email'),
        notifyProposals: document.getElementById('notify-proposals'),
        notifyMarketing: document.getElementById('notify-marketing'),
        twoFactor: document.getElementById('two-factor'),
        ratingNumber: document.getElementById('profile-rating-number'),
        ratingStars: document.getElementById('profile-rating-stars'),
        ratingCount: document.getElementById('profile-rating-count'),
        ratingBreakdown: document.getElementById('rating-breakdown'),
        reviewsList: document.getElementById('reviews-list'),
        leadsList: document.getElementById('profile-leads-list'),
        activityList: document.getElementById('profile-activity-list')
    };

    const servicosContainer = document.querySelector('.servicos-container');
    const profileStats = document.querySelector('.profile-stats');
    let salesChartInstance = null;
    let revenueChartInstance = null;
    let viewsChartInstance = null;
    const leadsDashboardCard = document.getElementById('leads-dashboard-card');
    const abrirContratos = () => {
        window.location.href = 'contratos.html';
    };

    if (leadsDashboardCard) {
        leadsDashboardCard.addEventListener('click', abrirContratos);
        leadsDashboardCard.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                abrirContratos();
            }
        });
    }

    function splitName(nome = '') {
        const parts = nome.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return { firstName: '', lastName: '' };
        return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }

    function formatMemberSince(dateValue) {
        if (!dateValue) return 'Workly desde --';
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return 'Workly desde --';

        const formatted = date.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });

        return `Workly desde ${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
    }

    function setText(element, value) {
        if (element) element.textContent = value;
    }

    const areaAtuacaoMap = {
        '1': 'Design',
        '2': 'Programação',
        '3': 'Vídeo/Edição',
        '4': 'Inteligência Artificial',
        '5': 'Escrita/Tradução',
        '6': 'Fotografia',
        '7': 'Áudio/Música',
        'Video/Edição': 'Vídeo/Edição',
        'Audio/Música': 'Áudio/Música'
    };

    function normalizeAreaAtuacao(area) {
        const value = String(area || '').trim();
        return areaAtuacaoMap[value] || value;
    }

    function formatRating(value) {
        const number = Number(value || 0);
        return number > 0 ? number.toFixed(1).replace('.', ',') : '--';
    }

    function formatDate(dateValue) {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('pt-BR');
    }

    function escapeProfileText(text = '') {
        if (window.Workly.escapeHtml) return window.Workly.escapeHtml(text);
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function starsMarkup(value) {
        const rating = Number(value || 0);
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += '<i class="' + (rating >= i ? 'fas' : 'far') + ' fa-star"></i>';
        }
        return html;
    }

    function renderRatingBreakdown(distribuicao = {}, total = 0) {
        if (!profileElements.ratingBreakdown) return;
        if (!total) {
            profileElements.ratingBreakdown.innerHTML = '<p>As avaliações reais recebidas aparecerão aqui automaticamente.</p>';
            profileElements.ratingBreakdown.classList.add('empty-review-info');
            return;
        }
        profileElements.ratingBreakdown.classList.remove('empty-review-info');
        profileElements.ratingBreakdown.innerHTML = [5, 4, 3, 2, 1].map((nota) => {
            const qtd = Number(distribuicao[nota] || 0);
            const percent = total ? Math.round((qtd / total) * 100) : 0;
            return [
                '<div class="rating-breakdown-row">',
                    '<span>' + nota + ' <i class="fas fa-star"></i></span>',
                    '<div class="rating-breakdown-bar"><span style="width: ' + percent + '%"></span></div>',
                    '<strong>' + qtd + '</strong>',
                '</div>'
            ].join('');
        }).join('');
    }

    function renderReviews(reviews = [], summary = {}) {
        const total = Number(summary.total ?? reviews.length ?? 0);
        const mediaFreelancer = Number(summary.mediaFreelancer || 0);

        setText(profileElements.overviewRating, total ? formatRating(mediaFreelancer) + ' (' + total + ')' : '--');
        setText(profileElements.ratingNumber, formatRating(mediaFreelancer));
        if (profileElements.ratingStars) {
            profileElements.ratingStars.classList.toggle('muted-stars', !total);
            profileElements.ratingStars.innerHTML = starsMarkup(mediaFreelancer);
        }
        setText(profileElements.ratingCount, total === 1 ? '1 avaliação recebida' : total + ' avaliações recebidas');
        renderRatingBreakdown(summary.distribuicao || {}, total);

        if (!profileElements.reviewsList) return;
        if (!reviews.length) {
            profileElements.reviewsList.innerHTML = '<div class="empty-state-card"><h3>Nenhuma avaliação recebida ainda</h3><p>Quando um contratante finalizar e avaliar um contrato, o comentário aparecerá aqui.</p></div>';
            return;
        }

        profileElements.reviewsList.innerHTML = reviews.map((review) => {
            const autor = review.autor || {};
            const servico = review.servico || {};
            const foto = autor.fotoPerfil || window.Workly.defaultProfileImage;
            const nomeAutor = escapeProfileText(autor.nome || 'Cliente');
            const nomeServico = escapeProfileText(servico.nome || 'Serviço avaliado');
            const comentario = escapeProfileText(review.comentario || 'Sem comentário.');
            return [
                '<article class="profile-review-card">',
                    '<div class="profile-review-top">',
                        '<img src="' + foto + '" alt="Foto do cliente" class="profile-review-avatar">',
                        '<div><h4>' + nomeAutor + '</h4><p>' + nomeServico + '</p></div>',
                        '<span class="profile-review-date">' + formatDate(review.createdAt) + '</span>',
                    '</div>',
                    '<div class="profile-review-stars">' + starsMarkup(review.notaFreelancer) + '</div>',
                    '<p class="profile-review-comment">' + comentario + '</p>',
                    '<div class="profile-review-notes">',
                        '<span>Freelancer: ' + formatRating(review.notaFreelancer) + '</span>',
                        '<span>Serviço: ' + formatRating(review.notaServico) + '</span>',
                    '</div>',
                '</article>'
            ].join('');
        }).join('');
    }

    function formatContractStatus(status) {
        const labels = {
            pendente: 'Aguardando início',
            proposta_pendente: 'Proposta pendente',
            proposta_aceita: 'Proposta aceita',
            em_andamento: 'Em andamento',
            concluido: 'Concluído',
            cancelado: 'Cancelado',
            encerrado: 'Concluído'
        };
        return labels[status] || 'Pendente';
    }

    function formatLeadPrice(lead) {
        if (lead.tipoContratacao === 'combinar' && !lead.preco && !lead.precoProposto) return 'Valor a combinar';
        const value = lead.precoProposto || lead.preco_proposto || lead.preco || 0;
        if (!value) return 'Sem valor definido';
        return window.Workly.formatCurrency ? window.Workly.formatCurrency(value) : 'R$ ' + Number(value).toFixed(2).replace('.', ',');
    }

    function renderLeads(leads = []) {
        if (!profileElements.leadsList) return;

        if (!leads.length) {
            profileElements.leadsList.innerHTML = [
                '<div class="empty-state-card compact">',
                    '<h4>Nenhum lead ainda</h4>',
                    '<p>As propostas recebidas aparecerão aqui automaticamente.</p>',
                '</div>'
            ].join('');
            return;
        }

        const visibleLeads = leads.slice(0, 3);
        profileElements.leadsList.innerHTML = visibleLeads.map((lead) => {
            const cliente = lead.cliente || {};
            const clienteNome = escapeProfileText(cliente.nome || 'Cliente');
            const clienteFoto = cliente.fotoPerfil || window.Workly.defaultProfileImage;
            const servicoNome = escapeProfileText(lead.nomeServico || lead.nome_servico || 'Serviço');
            const mensagem = escapeProfileText(lead.mensagem || 'Sem mensagem enviada.');
            const status = String(lead.status || 'pendente');
            const tipo = lead.tipoContratacao === 'fixo' ? 'Contratação direta' : 'Proposta recebida';
            const statusClass = (status === 'concluido' || status === 'encerrado') ? 'status-concluido' : (status === 'pendente' || status === 'proposta_pendente' ? 'status-pendente' : (status === 'cancelado' ? 'status-cancelado' : 'status-andamento'));

            return [
                '<article class="lead-item proposal-lead">',
                    '<img class="lead-avatar" src="' + clienteFoto + '" alt="Foto do cliente">',
                    '<div class="lead-info">',
                        '<div class="lead-row">',
                            '<h4 class="lead-name">' + clienteNome + '</h4>',
                            '<span class="lead-status ' + statusClass + '">' + formatContractStatus(status) + '</span>',
                        '</div>',
                        '<p class="lead-service">' + tipo + ' · ' + servicoNome + '</p>',
                        '<p class="lead-email">' + mensagem + '</p>',
                        '<div class="lead-meta">',
                            '<span><i class="fas fa-money-bill-wave"></i> ' + formatLeadPrice(lead) + '</span>',
                            '<span><i class="fas fa-calendar"></i> ' + (formatDate(lead.createdAt) || 'Hoje') + '</span>',
                        '</div>',
                    '</div>',
                '</article>'
            ].join('');
        }).join('');
    }

    function formatActivityDate(dateValue) {
        if (!dateValue) return 'Agora';
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return 'Agora';
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Agora';
        if (diffMin < 60) return diffMin + ' min atrás';
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return diffHours + ' h atrás';
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays <= 7) return diffDays + ' d atrás';
        return date.toLocaleDateString('pt-BR');
    }

    function formatDashboardMoney(value) {
        const number = Number(value || 0);
        if (window.Workly.formatCurrency) return window.Workly.formatCurrency(number);
        return 'R$ ' + number.toFixed(2).replace('.', ',');
    }

    function renderRecentActivities(activities = []) {
        if (!profileElements.activityList) return;

        if (!activities.length) {
            profileElements.activityList.innerHTML = [
                '<div class="empty-state-card compact">',
                    '<h4>Nenhuma atividade recente</h4>',
                    '<p>Contratos, avaliações, favoritos e serviços publicados aparecerão aqui automaticamente.</p>',
                '</div>'
            ].join('');
            return;
        }

        const visibleActivities = activities.slice(0, 3);
        profileElements.activityList.innerHTML = visibleActivities.map((activity) => {
            const titulo = escapeProfileText(activity.titulo || 'Atividade');
            const descricao = escapeProfileText(activity.descricao || '');
            const status = escapeProfileText(activity.status || '');
            const icon = escapeProfileText(activity.icon || 'fa-bell');
            const tipo = escapeProfileText(activity.tipo || 'padrao');
            const valor = Number(activity.valor || 0);

            return [
                '<article class="activity-item activity-dynamic activity-' + tipo + '">',
                    '<div class="activity-icon"><i class="fas ' + icon + '"></i></div>',
                    '<div class="activity-content">',
                        '<div class="activity-title-row">',
                            '<p class="activity-title">' + titulo + '</p>',
                            status ? '<span class="activity-status">' + status + '</span>' : '',
                        '</div>',
                        descricao ? '<p class="activity-description">' + descricao + '</p>' : '',
                        '<div class="activity-footer">',
                            '<span class="activity-time">' + formatActivityDate(activity.date) + '</span>',
                            valor > 0 ? '<span class="activity-value">' + formatDashboardMoney(valor) + '</span>' : '',
                        '</div>',
                    '</div>',
                '</article>'
            ].join('');
        }).join('');
    }

    function parseDashboardDate(value) {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function getLastMonths(quantity = 6) {
        const now = new Date();
        const months = [];
        for (let i = quantity - 1; i >= 0; i -= 1) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
            const label = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
            months.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
        }
        return months;
    }

    function getFullMonthLabel(label = '') {
        const normalized = String(label || '').trim().replace('.', '').toLowerCase();
        const months = {
            jan: 'Janeiro',
            fev: 'Fevereiro',
            mar: 'Março',
            abr: 'Abril',
            mai: 'Maio',
            jun: 'Junho',
            jul: 'Julho',
            ago: 'Agosto',
            set: 'Setembro',
            out: 'Outubro',
            nov: 'Novembro',
            dez: 'Dezembro'
        };
        return months[normalized] || label || 'Mês atual';
    }

    function getMonthKey(value) {
        const date = parseDashboardDate(value);
        if (!date) return '';
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    }

    function numericValue(value) {
        const number = Number(value || 0);
        return Number.isFinite(number) ? number : 0;
    }

    function getContractValue(item = {}) {
        return numericValue(item.precoProposto || item.preco_proposto || item.preco || item.valor || 0);
    }

    function contractHasConfirmedValue(item = {}) {
        const status = String(item.status || 'pendente');
        const tipo = String(item.tipoContratacao || item.tipo_contratacao || 'fixo');
        if (status === 'cancelado') return false;
        if (tipo === 'fixo') return true;
        return ['proposta_aceita', 'em_andamento', 'concluido', 'encerrado'].includes(status);
    }

    function dashboardHasUsefulData(dashboard = {}) {
        const monthly = dashboard.monthlyPerformance || {};
        const primarySum = (monthly.primaryData || []).reduce((acc, value) => acc + numericValue(value), 0);
        const secondarySum = (monthly.secondaryData || []).reduce((acc, value) => acc + numericValue(value), 0);
        const recentCount = (dashboard.recentActivities || []).length;
        return primarySum > 0 || secondarySum > 0 || recentCount > 0;
    }

    function buildDashboardFallback(services = [], reviews = [], leads = [], usuario = {}) {
        const months = getLastMonths(6);
        const monthIndex = new Map(months.map((month, index) => [month.key, index]));
        const primaryData = months.map(() => 0);
        const secondaryData = months.map(() => 0);
        const distribution = new Map();
        const activities = [];

        (leads || []).forEach((lead) => {
            const date = lead.updatedAt || lead.createdAt || lead.created_at;
            const index = monthIndex.get(getMonthKey(date));
            const value = getContractValue(lead);
            const confirmedValue = contractHasConfirmedValue(lead);
            if (index !== undefined) {
                if (confirmedValue) primaryData[index] += value;
                secondaryData[index] += 1;
            }
            const serviceName = lead.nomeServico || lead.nome_servico || lead.servico?.nome || 'Serviço';
            const clientName = lead.cliente?.nome || lead.freelancer?.nome || 'Usuário';
            if (confirmedValue && value > 0) distribution.set(serviceName, (distribution.get(serviceName) || 0) + value);
            activities.push({
                tipo: 'contrato',
                icon: lead.tipoContratacao === 'fixo' ? 'fa-file-signature' : 'fa-handshake',
                titulo: lead.tipoContratacao === 'fixo' ? 'Contratação recebida' : 'Proposta recebida',
                descricao: clientName + ' · ' + serviceName,
                status: formatContractStatus(lead.status || 'pendente'),
                valor: value,
                date
            });
        });

        (services || []).forEach((service) => {
            const date = service.createdAt || service.created_at;
            const index = monthIndex.get(getMonthKey(date));
            const value = numericValue(service.preco || 0);
            if (index !== undefined) secondaryData[index] += 1;
            activities.push({
                tipo: 'servico',
                icon: 'fa-briefcase',
                titulo: 'Serviço publicado',
                descricao: service.nome || 'Serviço',
                status: service.nomeCategoria || service.nome_genero || 'Publicado',
                valor: value,
                date
            });
        });

        (reviews || []).forEach((review) => {
            const date = review.createdAt || review.created_at;
            const index = monthIndex.get(getMonthKey(date));
            if (index !== undefined) secondaryData[index] += 1;
            activities.push({
                tipo: 'avaliacao',
                icon: 'fa-star',
                titulo: 'Avaliação recebida',
                descricao: (review.autor?.nome || 'Cliente') + ' · ' + (review.servico?.nome || 'Serviço'),
                status: (review.notaFreelancer || review.nota_freelancer || review.notaServico || 0) + ' estrelas',
                valor: null,
                date
            });
        });

        const weeklyLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        const weeklyData = [0, 0, 0, 0, 0, 0, 0];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        activities.forEach((activity) => {
            const date = parseDashboardDate(activity.date);
            if (!date || date < sevenDaysAgo) return;
            const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
            weeklyData[index] += 1;
        });

        const distributionEntries = Array.from(distribution.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const totalValue = primaryData.reduce((acc, value) => acc + numericValue(value), 0);

        return {
            summary: {
                valorTotal: Number(totalValue.toFixed(2)),
                contratos: leads.length,
                propostas: leads.filter(lead => lead.tipoContratacao && lead.tipoContratacao !== 'fixo').length,
                servicosPublicados: services.length,
                atividades: activities.length
            },
            monthlyPerformance: {
                labels: months.map(month => month.label),
                primaryLabel: 'Receita/Gasto confirmado (R$)',
                primaryData: primaryData.map(value => Number(value.toFixed(2))),
                secondaryLabel: 'Atividades',
                secondaryData
            },
            revenueDistribution: {
                title: 'Valores confirmados por serviço',
                labels: distributionEntries.length ? distributionEntries.map(([label]) => label) : ['Sem movimentação ainda'],
                data: distributionEntries.length ? distributionEntries.map(([, value]) => Number(value.toFixed(2))) : [1],
                empty: distributionEntries.length === 0
            },
            weeklyActivity: { labels: weeklyLabels, data: weeklyData },
            recentActivities: activities
                .filter(activity => activity.date)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3)
        };
    }

    function mergeDashboardWithFallback(dashboard = {}, services = [], reviews = [], leads = [], usuario = {}) {
        const fallback = buildDashboardFallback(services, reviews, leads, usuario);
        const hasBackendData = dashboardHasUsefulData(dashboard);
        if (!hasBackendData) return fallback;

        const merged = { ...fallback, ...dashboard };
        merged.summary = { ...(fallback.summary || {}), ...(dashboard.summary || {}) };
        if (!dashboard.recentActivities || !dashboard.recentActivities.length) {
            merged.recentActivities = fallback.recentActivities;
        }
        if (!dashboard.monthlyPerformance || !dashboard.monthlyPerformance.labels) {
            merged.monthlyPerformance = fallback.monthlyPerformance;
        }
        if (!dashboard.weeklyActivity || !dashboard.weeklyActivity.labels) {
            merged.weeklyActivity = fallback.weeklyActivity;
        }
        if (!dashboard.revenueDistribution || !dashboard.revenueDistribution.labels) {
            merged.revenueDistribution = fallback.revenueDistribution;
        }
        return merged;
    }

    function renderDashboardSummary(summary = {}, monthly = {}) {
        const canvas = document.getElementById('salesChart');
        const card = canvas?.closest('.dashboard-card');
        if (!card) return;
        let box = card.querySelector('.dashboard-live-summary');
        if (!box) {
            box = document.createElement('div');
            box.className = 'dashboard-live-summary';
            card.appendChild(box);
        }

        const labels = monthly.labels || [];
        const primaryData = monthly.primaryData || [];
        const secondaryData = monthly.secondaryData || [];
        const lastIndex = Math.max(0, labels.length - 1);
        const lastLabel = getFullMonthLabel(labels[lastIndex] || 'mês atual');
        const lastMoney = numericValue(primaryData[lastIndex] || 0);
        const lastActions = numericValue(secondaryData[lastIndex] || 0);
        const total = summary.valorTotal || primaryData.reduce((acc, value) => acc + numericValue(value), 0);

        box.innerHTML = [
            '<div class="dashboard-live-item"><span>Total confirmado</span><strong>' + formatDashboardMoney(total) + '</strong></div>',
            '<div class="dashboard-live-item"><span>' + escapeProfileText(lastLabel) + '</span><strong>' + formatDashboardMoney(lastMoney) + '</strong></div>',
            '<div class="dashboard-live-item"><span>Atividades no mês</span><strong>' + lastActions + '</strong></div>',
            '<div class="dashboard-live-item"><span>Serviços publicados</span><strong>' + numericValue(summary.servicosPublicados || 0) + '</strong></div>'
        ].join('');
    }

    function updateChart(chart, labels = [], datasets = []) {
        if (!chart) return;
        chart.data.labels = labels;
        chart.data.datasets = datasets;
        chart.update();
    }

    function renderDashboardData(dashboard = {}, usuario = {}) {
        const monthly = dashboard.monthlyPerformance || {};
        const labels = monthly.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const primaryData = monthly.primaryData || labels.map(() => 0);
        const secondaryData = monthly.secondaryData || labels.map(() => 0);
        const primaryLabel = monthly.primaryLabel || (usuario.tipoConta === 'Contratante' ? 'Gastos (R$)' : 'Receita (R$)');
        const secondaryLabel = monthly.secondaryLabel || 'Ações';

        renderDashboardSummary(dashboard.summary || {}, monthly);

        updateChart(salesChartInstance, labels, [
            {
                label: primaryLabel,
                data: primaryData,
                backgroundColor: 'rgba(4, 191, 85, 0.12)',
                borderColor: '#04BF55',
                borderWidth: 3,
                pointBackgroundColor: '#04BF55',
                pointRadius: 4,
                fill: true,
                lineTension: 0.3,
                yAxisID: 'y-axis-money'
            },
            {
                label: secondaryLabel,
                data: secondaryData,
                backgroundColor: 'rgba(33, 150, 243, 0.10)',
                borderColor: '#2196F3',
                borderWidth: 2,
                pointBackgroundColor: '#2196F3',
                pointRadius: 3,
                fill: false,
                lineTension: 0.3,
                yAxisID: 'y-axis-count'
            }
        ]);

        const distribution = dashboard.revenueDistribution || {};
        const distributionLabels = distribution.labels || ['Sem receita ainda'];
        const distributionData = distribution.data || [1];

        updateChart(revenueChartInstance, distributionLabels, [
            {
                label: distribution.title || 'Distribuição',
                data: distributionData,
                backgroundColor: distribution.empty
                    ? ['rgba(148, 163, 184, 0.35)']
                    : ['#04BF55', '#2196F3', '#F59E0B', '#8B5CF6', '#EF4444'],
                borderColor: '#ffffff',
                borderWidth: 2
            }
        ]);

        const revenueCard = document.getElementById('revenueChart')?.closest('.dashboard-card');
        if (revenueCard) {
            let list = revenueCard.querySelector('.revenue-breakdown-list');
            if (!list) {
                list = document.createElement('div');
                list.className = 'revenue-breakdown-list';
                revenueCard.appendChild(list);
            }
            list.innerHTML = distribution.empty
                ? '<div class="revenue-breakdown-item"><span>Sem receita confirmada ainda</span><strong>R$ 0,00</strong></div>'
                : distributionLabels.map((label, index) => `<div class="revenue-breakdown-item"><span>${escapeProfileText(label)}</span><strong>${formatDashboardMoney(distributionData[index] || 0)}</strong></div>`).join('');
        }

        const weekly = dashboard.weeklyActivity || {};
        updateChart(viewsChartInstance, weekly.labels || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], [
            {
                label: 'Atividades',
                data: weekly.data || [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(34, 197, 94, 0.85)'
            }
        ]);

        renderRecentActivities(dashboard.recentActivities || []);
    }

    function fillProfile(user, services = [], reviews = [], reviewSummary = {}, leads = [], dashboard = {}) {
        const usuario = window.Workly.normalizeUser(user);
        const { firstName, lastName } = splitName(usuario.nome || '');
        const photo = usuario.fotoPerfil || window.Workly.defaultProfileImage;

        const tipoConta = usuario.tipoConta || usuario.tipo_conta || '--';
        const areaAtuacao = normalizeAreaAtuacao(usuario.areaAtuacao || usuario.area_atuacao) || '--';
        const tituloProfissional = usuario.tituloProfissional || usuario.titulo_profissional || '';
        const bioPerfil = usuario.bio || '';

        if (profileElements.name) profileElements.name.textContent = usuario.nome || 'Usuário';
        // no topo fica melhor mostrar cargo + área do que o texto genérico de "complete seu perfil".
        if (profileElements.title) profileElements.title.textContent = tituloProfissional || (tipoConta + ' • ' + areaAtuacao);
        // se o usuário ainda não escreveu bio, deixamos um texto honesto sem parecer erro/bug.
        if (profileElements.bioPreview) profileElements.bioPreview.textContent = bioPerfil || 'Adicione uma biografia nas configurações para contar um pouco sobre seus serviços e experiência.';
        if (profileElements.avatar) profileElements.avatar.src = photo;
        if (profileElements.currentPhoto) profileElements.currentPhoto.src = photo;
        if (profileElements.modalPhotoPreview) profileElements.modalPhotoPreview.src = photo;
        if (profileElements.memberSince) profileElements.memberSince.textContent = formatMemberSince(usuario.createdAt);
        if (profileElements.firstName) profileElements.firstName.value = firstName;
        if (profileElements.lastName) profileElements.lastName.value = lastName;
        if (profileElements.professionalTitle) profileElements.professionalTitle.value = usuario.tituloProfissional || '';
        if (profileElements.bio) profileElements.bio.value = usuario.bio || '';
        if (profileElements.email) profileElements.email.value = usuario.email || '';
        if (profileElements.phone) profileElements.phone.value = usuario.telefone || '';
        if (profileElements.location) profileElements.location.value = usuario.localizacao || '';
        if (profileElements.website) profileElements.website.value = usuario.site || '';
        if (profileElements.linkedin) profileElements.linkedin.value = usuario.linkedin || '';
        if (profileElements.github) profileElements.github.value = usuario.github || '';
        if (profileElements.instagram) profileElements.instagram.value = usuario.instagram || '';
        if (profileElements.portfolioTitle) profileElements.portfolioTitle.value = usuario.portfolioTitulo || usuario.portfolio_titulo || '';
        if (profileElements.portfolioDescription) profileElements.portfolioDescription.value = usuario.portfolioDescricao || usuario.portfolio_descricao || '';
        if (profileElements.portfolioUrl) profileElements.portfolioUrl.value = usuario.portfolioUrl || usuario.portfolio_url || '';
        if (profileElements.availability) profileElements.availability.value = usuario.disponibilidade || '';
        if (profileElements.hourPrice) profileElements.hourPrice.value = usuario.precoHora || usuario.preco_hora || '';
        if (profileElements.accountType) profileElements.accountType.value = usuario.tipoConta || usuario.tipo_conta || 'Freelancer';
        if (profileElements.currentAccountTypeLabel) profileElements.currentAccountTypeLabel.textContent = usuario.tipoConta || usuario.tipo_conta || '--';
        if (profileElements.accountArea) profileElements.accountArea.value = normalizeAreaAtuacao(usuario.areaAtuacao || usuario.area_atuacao || '');
        syncAccountTypeConfig();
        if (profileElements.paymentMethod) profileElements.paymentMethod.value = usuario.metodoPagamento || usuario.metodo_pagamento || '';
        if (profileElements.pixKey) profileElements.pixKey.value = usuario.chavePix || usuario.chave_pix || '';
        if (profileElements.bankInfo) profileElements.bankInfo.value = usuario.banco || '';
        if (profileElements.notifyEmail) profileElements.notifyEmail.checked = usuario.notificacoesEmail ?? usuario.notificacoes_email ?? true;
        if (profileElements.notifyProposals) profileElements.notifyProposals.checked = usuario.notificacoesPropostas ?? usuario.notificacoes_propostas ?? true;
        if (profileElements.notifyMarketing) profileElements.notifyMarketing.checked = usuario.notificacoesMarketing ?? usuario.notificacoes_marketing ?? false;
        if (profileElements.twoFactor) profileElements.twoFactor.checked = usuario.doisFatores ?? usuario.dois_fatores ?? false;

        setText(profileElements.headerServicesCount, services.length);
        setText(profileElements.headerAccountType, tipoConta);
        setText(profileElements.headerArea, areaAtuacao);

        setText(profileElements.overviewServicesCount, services.length);
        setText(profileElements.overviewAccountType, tipoConta);
        setText(profileElements.overviewArea, areaAtuacao);
        renderReviews(reviews, reviewSummary);
        renderLeads(leads);
        const dashboardFinal = mergeDashboardWithFallback(dashboard, services, reviews, leads, usuario);
        renderDashboardData(dashboardFinal, usuario);
        document.body.classList.toggle('profile-mode-contractor', String(tipoConta).toLowerCase().includes('contratante'));
        if (profileElements.overviewContractsCount) profileElements.overviewContractsCount.textContent = dashboardFinal.summary?.contratos || 0;
        if (profileElements.overviewProposalsCount) profileElements.overviewProposalsCount.textContent = dashboardFinal.summary?.propostas || 0;

        if (servicosContainer) {
            servicosContainer.innerHTML = '';
            if (services.length > 0) {
                services.forEach(service => {
                    servicosContainer.innerHTML += window.Workly.serviceCardMarkup(service, 'my-services');
                });
            } else {
                servicosContainer.innerHTML = '<p class="empty-state-message">Você ainda não publicou nenhum serviço.</p>';
            }
        }
    }

    // busca os dados do perfil e preenche dashboard, serviços e configurações.
async function loadProfile() {
        try {
            const response = await window.Workly.apiFetch('/api/usuarios/perfil');
            const user = window.Workly.normalizeUser(response.user || response.dados?.user);
            const services = (response.services || response.dados?.services || []).map(window.Workly.normalizeService);
            const reviews = response.reviews || response.dados?.reviews || [];
            const reviewSummary = response.reviewSummary || response.dados?.reviewSummary || {};
            const leads = response.leads || response.dados?.leads || [];
            const dashboard = response.dashboard || response.dados?.dashboard || {};
            window.Workly.setStoredUser(user);
            fillProfile(user, services, reviews, reviewSummary, leads, dashboard);
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            window.Workly.showAlert({ icon: 'error', title: 'Erro ao carregar perfil', text: error.message || 'Erro ao carregar perfil.', confirmText: 'Fechar' });
        }
    }

    const salesCanvas = document.getElementById('salesChart');
    if (salesCanvas && window.Chart) {
        salesChartInstance = new Chart(salesCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: { display: true, position: 'bottom', labels: { fontColor: '#cbd5e1' } },
                tooltips: { mode: 'index', intersect: false },
                // ajuste visual do gráfico no dark mode: grid mais suave e textos claros, senão fica bem apagado.
                scales: {
                    yAxes: [
                        {
                            id: 'y-axis-money',
                            type: 'linear',
                            position: 'left',
                            ticks: { beginAtZero: true, fontColor: '#94a3b8' },
                            gridLines: { color: 'rgba(148, 163, 184, 0.10)' }
                        },
                        {
                            id: 'y-axis-count',
                            type: 'linear',
                            position: 'right',
                            ticks: { beginAtZero: true, precision: 0, fontColor: '#94a3b8' },
                            gridLines: { drawOnChartArea: false, color: 'rgba(148, 163, 184, 0.10)' }
                        }
                    ]
                }
            }
        });
    }

    const revenueCanvas = document.getElementById('revenueChart');
    if (revenueCanvas && window.Chart) {
        revenueChartInstance = new Chart(revenueCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Sem receita ainda'],
                datasets: [{ data: [1], backgroundColor: ['rgba(148, 163, 184, 0.35)'], borderColor: '#ffffff', borderWidth: 2 }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutoutPercentage: 70, legend: { position: 'bottom', labels: { fontColor: '#cbd5e1' } } }
        });
    }

    const viewsCanvas = document.getElementById('viewsChart');
    if (viewsCanvas && window.Chart) {
        viewsChartInstance = new Chart(viewsCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{ label: 'Atividades', data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: 'rgba(34, 197, 94, 0.85)' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: { display: false },
                scales: {
                    yAxes: [{ ticks: { beginAtZero: true, precision: 0, fontColor: '#94a3b8' }, gridLines: { color: 'rgba(148, 163, 184, 0.10)' } }],
                    xAxes: [{ ticks: { fontColor: '#94a3b8' }, gridLines: { color: 'rgba(148, 163, 184, 0.08)' } }]
                }
            }
        });
    }

    loadProfile();

    const tabs = document.querySelectorAll('.profile-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const dashboardGrid = document.querySelector('.dashboard-grid');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.textContent.trim().toLowerCase();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (dashboardGrid) dashboardGrid.style.display = 'none';
            tabContents.forEach(content => { content.style.display = 'none'; });

            if (tabName === 'dashboard' && dashboardGrid) dashboardGrid.style.display = 'grid';
            if (tabName === 'serviços') document.getElementById('services-tab').style.display = 'block';
            if (tabName === 'avaliações') document.getElementById('reviews-tab').style.display = 'block';
            if (tabName === 'configurações') document.getElementById('settings-tab').style.display = 'block';
        });
    });

    tabs.forEach(t => t.classList.remove('active'));
    const defaultTab = document.querySelector('.profile-tab[data-tab="dashboard"]');
    if (defaultTab) defaultTab.classList.add('active');
    if (dashboardGrid) dashboardGrid.style.display = 'grid';
    ['services-tab', 'reviews-tab', 'settings-tab'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });

    const settingsNavItems = document.querySelectorAll('.settings-nav-item');
    const settingsSections = document.querySelectorAll('.settings-section');
    settingsNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            settingsNavItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            settingsSections.forEach(section => section.classList.remove('active'));
            const targetId = item.getAttribute('data-target');
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');
        });
    });

    const addServicoBtn = document.querySelector('.add-service-btn');
    if (addServicoBtn) {
        addServicoBtn.addEventListener('click', () => {
            window.location.href = 'anuncio.html';
        });
    }

    const updateProfileForm = document.getElementById('update-profile-form');
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const nome = `${profileElements.firstName?.value || ''} ${profileElements.lastName?.value || ''}`.trim();
            const data = {
                nome,
                email: profileElements.email?.value || '',
                telefone: profileElements.phone?.value || '',
                tituloProfissional: profileElements.professionalTitle?.value || '',
                bio: profileElements.bio?.value || '',
                localizacao: profileElements.location?.value || '',
                site: profileElements.website?.value || '',
                linkedin: profileElements.linkedin?.value || '',
                github: profileElements.github?.value || '',
                instagram: profileElements.instagram?.value || '',
                areaAtuacao: profileElements.accountArea?.value || ''
            };

            try {
                const result = await window.Workly.apiFetch('/api/usuarios/perfil', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                window.Workly.setStoredUser(result.user);
                await window.Workly.showAlert({ icon: 'success', title: 'Perfil atualizado!', text: result.mensagem || 'As informações do seu perfil foram salvas com sucesso.', confirmText: 'Continuar' });
                await loadProfile();
            } catch (error) {
                console.error('Erro ao atualizar perfil:', error);
                window.Workly.showAlert({ icon: 'error', title: 'Erro ao atualizar perfil', text: error.message || 'Não foi possível salvar as alterações do seu perfil.', confirmText: 'Fechar' });
            }
        });
    }

    async function saveProfilePartial(data, successTitle = 'Configurações salvas!') {
        const result = await window.Workly.apiFetch('/api/usuarios/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (result.user) window.Workly.setStoredUser(result.user);
        await loadProfile();
        await window.Workly.showAlert({ icon: 'success', title: successTitle, text: result.mensagem || 'Alterações salvas com sucesso.', confirmText: 'Continuar' });
    }

    const portfolioSettingsForm = document.getElementById('portfolio-settings-form');
    portfolioSettingsForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
            await saveProfilePartial({
                portfolioTitulo: profileElements.portfolioTitle?.value || '',
                portfolioDescricao: profileElements.portfolioDescription?.value || '',
                portfolioUrl: profileElements.portfolioUrl?.value || '',
                disponibilidade: profileElements.availability?.value || '',
                precoHora: profileElements.hourPrice?.value || ''
            }, 'Portfólio atualizado!');
        } catch (error) {
            console.error('Erro ao salvar portfólio:', error);
            window.Workly.showAlert({ icon: 'error', title: 'Erro ao salvar', text: error.message || 'Não foi possível salvar o portfólio.', confirmText: 'Fechar' });
        }
    });

    // mostra/esconde campos da troca de tipo de conta.
// freelancer precisa informar área de atuação.
function syncAccountTypeConfig() {
        const selectedType = profileElements.accountType?.value || 'Freelancer';
        if (profileElements.accountAreaWrapper) {
            profileElements.accountAreaWrapper.style.display = selectedType === 'Freelancer' ? 'block' : 'none';
        }
        if (profileElements.accountTypeHelp) {
            profileElements.accountTypeHelp.textContent = selectedType === 'Freelancer'
                ? 'Para virar freelancer, escolha uma área de atuação. Isso libera recursos como publicar serviços e receber leads.'
                : 'Para virar contratante, você não pode ter serviços publicados ou contratos ativos como freelancer.';
        }
    }

    profileElements.accountType?.addEventListener('change', syncAccountTypeConfig);

    const accountSettingsForm = document.getElementById('account-settings-form');
    // troca de tipo de conta usa rota separada e pede confirmação antes.
accountSettingsForm?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const novoTipo = profileElements.accountType?.value || 'Freelancer';
        const areaAtuacao = profileElements.accountArea?.value || '';

        if (novoTipo === 'Freelancer' && !areaAtuacao) {
            window.Workly.showAlert({
                icon: 'warning',
                title: 'Informe a área de atuação',
                text: 'Para usar a conta como freelancer, selecione uma área de atuação.',
                confirmText: 'Entendi'
            });
            return;
        }

        const confirmacao = await window.Workly.showConfirm({
            icon: 'warning',
            title: 'Alterar tipo de conta?',
            text: 'Essa mudança pode alterar permissões, serviços disponíveis e a visualização do seu perfil.',
            confirmText: 'Confirmar',
            cancelText: 'Cancelar'
        });

        if (!confirmacao.isConfirmed) return;

        try {
            const result = await window.Workly.apiFetch('/api/usuarios/tipo-conta', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipoConta: novoTipo, areaAtuacao })
            });

            if (result.user) window.Workly.setStoredUser(result.user);
            await loadProfile();
            await window.Workly.showAlert({
                icon: 'success',
                title: 'Tipo de conta atualizado!',
                text: result.mensagem || 'A configuração da conta foi alterada com sucesso.',
                confirmText: 'Continuar'
            });
        } catch (error) {
            console.error('Erro ao alterar tipo da conta:', error);
            window.Workly.showAlert({
                icon: 'error',
                title: 'Não foi possível alterar',
                text: error.message || 'Verifique se você possui serviços publicados ou contratos ativos antes de mudar o tipo da conta.',
                confirmText: 'Fechar'
            });
        }
    });

    const billingSettingsForm = document.getElementById('billing-settings-form');
    billingSettingsForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
            await saveProfilePartial({
                metodoPagamento: profileElements.paymentMethod?.value || '',
                chavePix: profileElements.pixKey?.value || '',
                banco: profileElements.bankInfo?.value || ''
            }, 'Pagamentos atualizados!');
        } catch (error) {
            console.error('Erro ao salvar pagamentos:', error);
            window.Workly.showAlert({ icon: 'error', title: 'Erro ao salvar', text: error.message || 'Não foi possível salvar os dados de pagamento.', confirmText: 'Fechar' });
        }
    });

    const notificationSettingsForm = document.getElementById('notification-settings-form');
    notificationSettingsForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
            await saveProfilePartial({
                notificacoesEmail: Boolean(profileElements.notifyEmail?.checked),
                notificacoesPropostas: Boolean(profileElements.notifyProposals?.checked),
                notificacoesMarketing: Boolean(profileElements.notifyMarketing?.checked)
            }, 'Notificações atualizadas!');
        } catch (error) {
            console.error('Erro ao salvar notificações:', error);
            window.Workly.showAlert({ icon: 'error', title: 'Erro ao salvar', text: error.message || 'Não foi possível salvar as notificações.', confirmText: 'Fechar' });
        }
    });

    const securitySettingsForm = document.getElementById('security-settings-form');
    securitySettingsForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const senhaAtual = document.getElementById('current-password')?.value || '';
        const novaSenha = document.getElementById('new-password')?.value || '';
        const confirmarSenha = document.getElementById('confirm-password')?.value || '';
        try {
            const result = await window.Workly.apiFetch('/api/usuarios/perfil/senha', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senhaAtual, novaSenha, confirmarSenha })
            });
            securitySettingsForm.reset();
            if (profileElements.twoFactor) profileElements.twoFactor.checked = window.Workly.getStoredUser()?.doisFatores || false;
            await window.Workly.showAlert({ icon: 'success', title: 'Senha atualizada!', text: result.mensagem || 'Sua senha foi alterada com sucesso.', confirmText: 'Continuar' });
        } catch (error) {
            console.error('Erro ao atualizar senha:', error);
            window.Workly.showAlert({ icon: 'error', title: 'Erro ao atualizar senha', text: error.message || 'Não foi possível atualizar a senha.', confirmText: 'Fechar' });
        }
    });

    const saveSecurityPreferences = document.getElementById('save-security-preferences');
    saveSecurityPreferences?.addEventListener('click', async function() {
        try {
            await saveProfilePartial({ doisFatores: Boolean(profileElements.twoFactor?.checked) }, 'Preferências de segurança salvas!');
        } catch (error) {
            console.error('Erro ao salvar segurança:', error);
            window.Workly.showAlert({ icon: 'error', title: 'Erro ao salvar', text: error.message || 'Não foi possível salvar as preferências de segurança.', confirmText: 'Fechar' });
        }
    });

    document.querySelectorAll('[data-reset-section]').forEach(button => {
        button.addEventListener('click', () => loadProfile());
    });

    const photoModal = document.getElementById('photo-modal');
    const openPhotoModal = document.getElementById('open-photo-modal');
    const openPhotoModalSettings = document.getElementById('open-photo-modal-settings');
    const closePhotoModal = document.getElementById('close-photo-modal');
    const cancelPhotoModal = document.getElementById('cancel-photo-modal');
    const photoInput = document.getElementById('nova_foto');
    const cropperStage = document.getElementById('cropper-stage');
    const cropperEditor = document.getElementById('cropper-editor');
    const photoPickerEmpty = document.getElementById('photo-picker-empty');
    const photoZoom = document.getElementById('photo-zoom');
    const resetPhotoCrop = document.getElementById('reset-photo-crop');
    const savePhotoBtn = document.getElementById('save-photo-btn');
    const cropCanvas = document.getElementById('photo-crop-canvas');
    const cropCtx = cropCanvas?.getContext('2d', { alpha: false });

    const cropState = {
        imageUrl: '',
        image: null,
        zoom: 1,
        minZoom: 1,
        x: 0,
        y: 0,
        dragging: false,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
        rafId: null,
        hasSelectedImage: false
    };

    function getCanvasSize() {
        return cropCanvas ? cropCanvas.width : 280;
    }

    function getCropFrame() {
        const size = getCanvasSize();
        const frameSize = size * (220 / 280);
        const frameStart = (size - frameSize) / 2;
        return { stageSize: size, frameSize, frameStart };
    }

    function setCropperVisible(visible) {
        cropState.hasSelectedImage = Boolean(visible);
        if (cropperEditor) cropperEditor.hidden = !visible;
        if (photoPickerEmpty) photoPickerEmpty.hidden = visible;
        if (savePhotoBtn) savePhotoBtn.disabled = !visible;
        if (cropperStage) cropperStage.classList.toggle('is-ready', visible);
    }

    function resizeCropCanvas() {
        if (!cropCanvas || !cropperStage) return;
        const rect = cropperStage.getBoundingClientRect();
        const size = Math.round(rect.width || 280);
        if (cropCanvas.width !== size || cropCanvas.height !== size) {
            cropCanvas.width = size;
            cropCanvas.height = size;
        }
    }

    function clampCropPosition() {
        if (!cropState.image) return;
        const frame = getCropFrame();
        const imgW = cropState.image.naturalWidth * cropState.zoom;
        const imgH = cropState.image.naturalHeight * cropState.zoom;
        const maxX = Math.max(0, (imgW - frame.frameSize) / 2);
        const maxY = Math.max(0, (imgH - frame.frameSize) / 2);
        cropState.x = Math.min(maxX, Math.max(-maxX, cropState.x));
        cropState.y = Math.min(maxY, Math.max(-maxY, cropState.y));
    }

    function drawCropCanvas() {
        if (!cropCtx || !cropCanvas) return;
        resizeCropCanvas();
        const size = getCanvasSize();
        cropCtx.clearRect(0, 0, size, size);
        cropCtx.fillStyle = '#0b1220';
        cropCtx.fillRect(0, 0, size, size);

        if (!cropState.image) return;

        clampCropPosition();
        const img = cropState.image;
        const drawW = img.naturalWidth * cropState.zoom;
        const drawH = img.naturalHeight * cropState.zoom;
        const drawX = (size - drawW) / 2 + cropState.x;
        const drawY = (size - drawH) / 2 + cropState.y;

        cropCtx.imageSmoothingEnabled = true;
        cropCtx.imageSmoothingQuality = 'high';
        cropCtx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    function requestCropRender() {
        if (cropState.rafId) return;
        cropState.rafId = requestAnimationFrame(() => {
            cropState.rafId = null;
            drawCropCanvas();
        });
    }

    function formatZoomValue(value) {
        return Number(value).toFixed(6).replace(/0+$/, '').replace(/\.$/, '') || '0';
    }

    function getPhotoZoomBounds() {
        return {
            min: Number(photoZoom?.min) || cropState.minZoom || 1,
            max: Number(photoZoom?.max) || (cropState.minZoom || 1) * 3
        };
    }

    function setPhotoZoomValue(value) {
        const bounds = getPhotoZoomBounds();
        const safeValue = Math.min(bounds.max, Math.max(bounds.min, Number(value) || bounds.min));
        cropState.zoom = safeValue;
        if (photoZoom) {
            // Firefox/Floorp valida range de forma mais rígida quando min/step são decimais.
            // step="any" evita o erro nativo de "valor inválido" ao salvar a foto.
            photoZoom.step = 'any';
            photoZoom.value = formatZoomValue(safeValue);
        }
        return safeValue;
    }

    function resetCrop() {
        if (!cropState.image) return;
        const frame = getCropFrame();
        cropState.minZoom = Math.max(frame.frameSize / cropState.image.naturalWidth, frame.frameSize / cropState.image.naturalHeight);
        cropState.x = 0;
        cropState.y = 0;
        if (photoZoom) {
            const minZoom = formatZoomValue(cropState.minZoom);
            const maxZoom = formatZoomValue(cropState.minZoom * 3);
            photoZoom.min = minZoom;
            photoZoom.max = maxZoom;
            photoZoom.step = 'any';
        }
        setPhotoZoomValue(cropState.minZoom);
        requestCropRender();
    }

    function limparSelecaoFoto() {
        if (photoInput) photoInput.value = '';
        cropState.image = null;
        cropState.zoom = 1;
        cropState.minZoom = 1;
        cropState.x = 0;
        cropState.y = 0;
        if (photoZoom) {
            photoZoom.min = '1';
            photoZoom.max = '3';
            photoZoom.step = 'any';
            photoZoom.value = '1';
        }
        if (cropCtx && cropCanvas) {
            cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        }
        setCropperVisible(false);
    }

    function abrirModalFoto() {
        if (!photoModal) return;
        limparSelecaoFoto();
        photoModal.classList.add('active');
        photoModal.setAttribute('aria-hidden', 'false');
        setTimeout(resizeCropCanvas, 0);
    }

    function fecharModalFoto() {
        if (!photoModal) return;
        photoModal.classList.remove('active');
        photoModal.setAttribute('aria-hidden', 'true');
        if (cropState.imageUrl) {
            URL.revokeObjectURL(cropState.imageUrl);
            cropState.imageUrl = '';
        }
        limparSelecaoFoto();
    }

    function loadCropImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                cropState.image = img;
                resizeCropCanvas();
                resetCrop();
                resolve();
            };
            img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
            img.src = src;
        });
    }

    function createCroppedPhotoBlob() {
        return new Promise((resolve, reject) => {
            if (!cropState.image) return reject(new Error('Imagem inválida para recorte.'));
            const outputSize = 512;
            const previewSize = getCanvasSize();
            const frame = getCropFrame();
            const canvas = document.createElement('canvas');
            canvas.width = outputSize;
            canvas.height = outputSize;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const img = cropState.image;
            const drawW = img.naturalWidth * cropState.zoom;
            const drawH = img.naturalHeight * cropState.zoom;
            const drawX = (previewSize - drawW) / 2 + cropState.x;
            const drawY = (previewSize - drawH) / 2 + cropState.y;
            const scaleToOutput = outputSize / frame.frameSize;

            ctx.drawImage(
                img,
                (drawX - frame.frameStart) * scaleToOutput,
                (drawY - frame.frameStart) * scaleToOutput,
                drawW * scaleToOutput,
                drawH * scaleToOutput
            );

            canvas.toBlob(blob => {
                if (!blob) return reject(new Error('Não foi possível gerar a imagem recortada.'));
                resolve(blob);
            }, 'image/webp', 0.92);
        });
    }

    openPhotoModal?.addEventListener('click', abrirModalFoto);
    openPhotoModalSettings?.addEventListener('click', abrirModalFoto);
    closePhotoModal?.addEventListener('click', fecharModalFoto);
    cancelPhotoModal?.addEventListener('click', fecharModalFoto);
    resetPhotoCrop?.addEventListener('click', resetCrop);

    photoModal?.addEventListener('click', function(e) {
        if (e.target === photoModal) fecharModalFoto();
    });

    photoZoom?.addEventListener('input', function() {
        setPhotoZoomValue(this.value);
        requestCropRender();
    });

    cropperStage?.addEventListener('pointerdown', function(e) {
        if (!cropState.hasSelectedImage) return;
        e.preventDefault();
        cropState.dragging = true;
        cropState.startX = e.clientX;
        cropState.startY = e.clientY;
        cropState.originX = cropState.x;
        cropState.originY = cropState.y;
        cropperStage.classList.add('dragging');
        try { cropperStage.setPointerCapture(e.pointerId); } catch (_) {}
    });

    cropperStage?.addEventListener('pointermove', function(e) {
        if (!cropState.dragging) return;
        e.preventDefault();
        cropState.x = cropState.originX + (e.clientX - cropState.startX);
        cropState.y = cropState.originY + (e.clientY - cropState.startY);
        requestCropRender();
    });

    function pararArrasteFoto(e) {
        if (!cropState.dragging) return;
        cropState.dragging = false;
        cropperStage?.classList.remove('dragging');
        try { cropperStage?.releasePointerCapture(e.pointerId); } catch (_) {}
        requestCropRender();
    }

    cropperStage?.addEventListener('pointerup', pararArrasteFoto);
    cropperStage?.addEventListener('pointercancel', pararArrasteFoto);

    cropperStage?.addEventListener('wheel', function(e) {
        if (!cropState.hasSelectedImage) return;
        e.preventDefault();
        const direction = e.deltaY > 0 ? -1 : 1;
        const step = Math.max(cropState.minZoom * 0.08, 0.01);
        setPhotoZoomValue(cropState.zoom + direction * step);
        requestCropRender();
    }, { passive: false });

    window.addEventListener('resize', () => {
        if (!cropState.hasSelectedImage) return;
        resizeCropCanvas();
        resetCrop();
    });

    photoInput?.addEventListener('change', async function() {
        const file = this.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            window.Workly.showAlert({
                icon: 'warning',
                title: 'Arquivo inválido',
                text: 'Escolha uma imagem válida para usar como foto de perfil.',
                confirmText: 'Fechar'
            });
            this.value = '';
            return;
        }

        if (cropState.imageUrl) URL.revokeObjectURL(cropState.imageUrl);
        cropState.imageUrl = URL.createObjectURL(file);
        setCropperVisible(true);
        await loadCropImage(cropState.imageUrl);
    });

    const updatePhotoForm = document.getElementById('update-photo-form');
    if (updatePhotoForm) {
        updatePhotoForm.noValidate = true;
        updatePhotoForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!photoInput?.files?.length || !cropState.image) {
                window.Workly.showAlert({
                    icon: 'warning',
                    title: 'Escolha uma imagem',
                    text: 'Selecione uma foto antes de salvar.',
                    confirmText: 'Fechar'
                });
                return;
            }

            try {
                const croppedBlob = await createCroppedPhotoBlob();
                const formData = new FormData();
                formData.append('nova_foto', croppedBlob, 'foto-perfil.webp');

                const result = await window.Workly.apiFetch('/api/usuarios/perfil/foto', {
                    method: 'POST',
                    body: formData
                });
                if (result.user) window.Workly.setStoredUser(result.user);
                fecharModalFoto();
                await loadProfile();
                await window.Workly.showAlert({ icon: 'success', title: 'Foto atualizada!', text: result.mensagem || 'Sua foto foi atualizada com sucesso.', confirmText: 'Continuar' });
            } catch (error) {
                console.error('Erro ao atualizar foto:', error);
                window.Workly.showAlert({ icon: 'error', title: 'Erro ao atualizar foto', text: error.message || 'Não foi possível atualizar sua foto agora.', confirmText: 'Fechar' });
            }
        });
    }

    const deleteAccountForm = document.getElementById('delete-account-form');
    if (deleteAccountForm) {
        deleteAccountForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const confirmacaoExclusao = await window.Workly.showConfirm({ title: 'Excluir conta?', text: 'Tem certeza que deseja excluir sua conta? Esta ação é irreversível.', icon: 'warning', confirmText: 'Excluir', cancelText: 'Cancelar' });
            if (!confirmacaoExclusao.isConfirmed) return;
            try {
                const result = await window.Workly.apiFetch('/api/usuarios/perfil', { method: 'DELETE' });
                await window.Workly.showAlert({ icon: 'success', title: 'Conta excluída', text: result.mensagem || 'Sua conta foi excluída com sucesso.', confirmText: 'OK' });
                window.Workly.logout('index.html');
            } catch (error) {
                console.error('Erro ao excluir conta:', error);
                window.Workly.showAlert({ icon: 'error', title: 'Erro ao excluir conta', text: error.message || 'Não foi possível excluir sua conta.', confirmText: 'Fechar' });
            }
        });
    }
});
