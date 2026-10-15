export function formatContractStatus(status) {
  const labels = {
    pendente: 'Aguardando início',
    entregue: 'Aguardando confirmação',
    proposta_pendente: 'Proposta pendente',
    proposta_aceita: 'Proposta aceita',
    em_andamento: 'Em andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    encerrado: 'Concluído'
  };
  return labels[status] || 'Pendente';
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
  const normalized = String(label || '')
    .trim()
    .replace('.', '')
    .toLowerCase();
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
  return ['concluido', 'encerrado'].includes(String(item.status));
}

function dashboardHasUsefulData(dashboard = {}) {
  const monthly = dashboard.monthlyPerformance || {};
  const primarySum = (monthly.primaryData || []).reduce(
    (acc, value) => acc + numericValue(value),
    0
  );
  const secondarySum = (monthly.secondaryData || []).reduce(
    (acc, value) => acc + numericValue(value),
    0
  );
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
    const seller = lead.freelancer?._id || lead.freelancer?.idUsuario || lead.freelancer;
    const userId = usuario.idUsuario || usuario._id;
    const confirmedValue = contractHasConfirmedValue(lead) && Boolean(seller && userId && String(seller) === String(userId));
    if (index !== undefined) {
      if (confirmedValue) primaryData[index] += value;
      secondaryData[index] += 1;
    }
    const serviceName = lead.nomeServico || lead.nome_servico || lead.servico?.nome || 'Serviço';
    const clientName = lead.cliente?.nome || lead.freelancer?.nome || 'Usuário';
    if (confirmedValue && value > 0)
      distribution.set(serviceName, (distribution.get(serviceName) || 0) + value);
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
      status:
        (review.notaFreelancer || review.nota_freelancer || review.notaServico || 0) + ' estrelas',
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

  const distributionEntries = Array.from(distribution.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalValue = primaryData.reduce((acc, value) => acc + numericValue(value), 0);

  return {
    summary: {
      valorTotal: Number(totalValue.toFixed(2)),
      contratos: leads.length,
      propostas: leads.filter((lead) => lead.tipoContratacao && lead.tipoContratacao !== 'fixo')
        .length,
      servicosPublicados: services.length,
      atividades: activities.length
    },
    monthlyPerformance: {
      labels: months.map((month) => month.label),
      primaryLabel: 'Receita de serviços concluídos (R$)',
      primaryData: primaryData.map((value) => Number(value.toFixed(2))),
      secondaryLabel: 'Atividades',
      secondaryData
    },
    revenueDistribution: {
      title: 'Valores confirmados por serviço',
      labels: distributionEntries.length
        ? distributionEntries.map(([label]) => label)
        : ['Sem movimentação ainda'],
      data: distributionEntries.length
        ? distributionEntries.map(([, value]) => Number(value.toFixed(2)))
        : [0],
      empty: distributionEntries.length === 0
    },
    weeklyActivity: { labels: weeklyLabels, data: weeklyData },
    recentActivities: activities
      .filter((activity) => activity.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
  };
}

export function mergeDashboardWithFallback(
  dashboard = {},
  services = [],
  reviews = [],
  leads = [],
  usuario = {}
) {
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
