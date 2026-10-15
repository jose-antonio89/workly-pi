import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { EmptyState, ErrorState } from '../ui/Feedback';
import { defaultProfileImage, formatCurrency } from '../../services/catalogService';
import { formatContractStatus, mergeDashboardWithFallback } from '../../services/profileDashboard';
import { panel, emptyPanel } from './ProfileHeader';
import { salesConfig, revenueConfig, viewsConfig } from './profileChartConfig';

let chartPromise;
function chartLibrary() {
  if (window.Chart) return Promise.resolve(window.Chart);
  if (!chartPromise)
    chartPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/vendor/chart/Chart.min.js';
      script.onload = () => resolve(window.Chart);
      script.onerror = () => {
        chartPromise = null;
        script.remove();
        reject(new Error('Não foi possível carregar os gráficos.'));
      };
      document.head.appendChild(script);
    });
  return chartPromise;
}
function Chart({ id, config, data }) {
  const ref = useRef(null),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true,
      chart;
    chartLibrary()
      .then((Library) => {
        if (active) {
          chart = new Library(ref.current.getContext('2d'), config());
          chart.data = data;
          chart.update();
        }
      })
      .catch((value) => {
        if (active) setError(value.message);
      });
    return () => {
      active = false;
      chart?.destroy();
    };
  }, [config, data]);
  return (
    <div className="relative h-[300px] w-full min-w-0">
      <canvas id={id} ref={ref} className="max-w-full" />
      {error && <ErrorState>{error}</ErrorState>}
    </div>
  );
}
function activityDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Agora';
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return minutes + ' min atrás';
  if (minutes < 1440) return Math.floor(minutes / 60) + ' h atrás';
  if (minutes < 11520) return Math.floor(minutes / 1440) + ' d atrás';
  return new Date(value).toLocaleDateString('pt-BR');
}
export default function ProfileDashboard({ data }) {
  const dashboard = mergeDashboardWithFallback(
    data.dashboard,
    data.services,
    data.reviews,
    data.leads,
    data.user
  );
  const monthly = dashboard.monthlyPerformance || {},
    distribution = dashboard.revenueDistribution || {},
    weekly = dashboard.weeklyActivity || {},
    summary = dashboard.summary || {};
  const title =
    'relative mb-5 pb-2.5 text-[1.3rem] font-bold text-workly-primary after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-10 after:bg-workly-primary';
  const stats = [
    [data.services.length, 'Serviços Publicados'],
    [
      data.reviewSummary.total
        ? Number(data.reviewSummary.mediaFreelancer || 0)
            .toFixed(1)
            .replace('.', ',') +
          ' (' +
          data.reviewSummary.total +
          ')'
        : '--',
      'Avaliação'
    ],
    [summary.contratos || 0, 'Contratos'],
    [summary.propostas || 0, 'Propostas']
  ];
  const labels = monthly.labels || [],
    last = Math.max(0, labels.length - 1);
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
  const month =
    months[
      String(labels[last] || '')
        .toLowerCase()
        .replace('.', '')
    ] ||
    labels[last] ||
    'mês atual';
  const salesData = {
    labels,
    datasets: [
      {
        label:
          monthly.primaryLabel ||
          (data.user.tipoConta === 'Contratante' ? 'Gastos (R$)' : 'Receita (R$)'),
        data: monthly.primaryData || [],
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
        label: monthly.secondaryLabel || 'Ações',
        data: monthly.secondaryData || [],
        backgroundColor: 'rgba(33, 150, 243, 0.10)',
        borderColor: '#2196F3',
        borderWidth: 2,
        pointBackgroundColor: '#2196F3',
        pointRadius: 3,
        fill: false,
        lineTension: 0.3,
        yAxisID: 'y-axis-count'
      }
    ]
  };
  const revenueData = {
    labels: distribution.labels || ['Sem receita ainda'],
    datasets: [
      {
        label: distribution.title || 'Distribuição',
        data: distribution.data || [1],
        backgroundColor: distribution.empty
          ? ['rgba(148, 163, 184, 0.35)']
          : ['#04BF55', '#2196F3', '#F59E0B', '#8B5CF6', '#EF4444'],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };
  return (
    <div className="workly-dashboard-parity mb-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-stretch gap-5 legacy-max-768:grid-cols-1 [&>section]:animate-workly-legacy-in [&>section:nth-child(1)]:[animation-delay:.1s] [&>section:nth-child(2)]:[animation-delay:.2s] [&>section:nth-child(3)]:[animation-delay:.3s] [&>section:nth-child(4)]:[animation-delay:.4s] [&>section:nth-child(5)]:[animation-delay:.5s] [&>section:nth-child(6)]:[animation-delay:.6s]">
      <section className={`${panel} p-[25px]`}>
        <h3 className={title}>Visão Geral</h3>
        <div className="mb-5 flex flex-wrap gap-[14px]">
          {stats.map(([value, label]) => (
            <div
              key={label}
              className="mb-[15px] min-w-[170px] flex-[1_1_180px] rounded-[10px] bg-[#f8f9fa] p-[15px] text-center dark:bg-[#0f172a]/70"
            >
              <strong className="block text-[1.8rem] text-workly-primary">{value}</strong>
              <span className="text-[0.9rem] text-[#9e9e9e]">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/contratos"
            className="rounded-full bg-workly-primary/10 px-4 py-2 text-sm font-bold text-workly-primary dark:bg-[#1e293b]"
          >
            <i className="fas fa-briefcase" aria-hidden="true" /> Ver contratos
          </Link>
          <Link
            to="/anuncio"
            className="rounded-full bg-workly-primary px-4 py-2 text-sm font-bold text-white"
          >
            <i className="fas fa-plus" aria-hidden="true" /> Novo serviço
          </Link>
        </div>
      </section>
      <section className={`${panel} p-[25px]`}>
        <h3 className={title}>Desempenho Mensal</h3>
        <Chart id="salesChart" config={salesConfig} data={salesData} />
        <div className="mt-[14px] grid grid-cols-2 gap-2.5 legacy-max-600:grid-cols-1">
          {[
            [
              formatCurrency(
                summary.valorTotal ||
                  (monthly.primaryData || []).reduce((sum, value) => sum + Number(value || 0), 0)
              ),
              'Total confirmado'
            ],
            [formatCurrency(monthly.primaryData?.[last] || 0), month],
            [monthly.secondaryData?.[last] || 0, 'Atividades no mês'],
            [summary.servicosPublicados || 0, 'Serviços publicados']
          ].map(([value, label]) => (
            <div
              key={label}
              className="min-w-0 rounded-[14px] border border-workly-primary/14 bg-workly-primary/8 px-[14px] py-3 dark:bg-workly-primary/12"
            >
              <span className="mb-1 block text-[.78rem] text-[#64748b] dark:text-[#a9b9cf]">
                {label}
              </span>
              <strong className="block break-words font-extrabold text-[#101827] dark:text-[#f8fafc]">
                {value}
              </strong>
            </div>
          ))}
        </div>
      </section>
      <section
        className={`${panel} p-[25px] cursor-pointer focus-visible:outline-2 focus-visible:outline-workly-primary`}
        role="button"
        tabIndex={0}
        aria-label="Abrir página de contratos"
        onClick={() => location.assign('/contratos')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            location.assign('/contratos');
          }
        }}
      >
        <h3 className={`${title} flex flex-wrap justify-between gap-3`}>
          Leads{' '}
          <span className="text-sm">
            Ver contratos <i className="fas fa-arrow-right" aria-hidden="true" />
          </span>
        </h3>
        {data.leads.length ? (
          data.leads.slice(0, 3).map((lead, index) => (
            <article
              key={lead.idContrato || index}
              className="flex min-w-0 gap-3 border-b border-[#e0e0e0] py-[14px] dark:border-white/8"
            >
              <img
                src={lead.cliente?.fotoPerfil || defaultProfileImage}
                alt="Foto do cliente"
                className="h-10 w-[42px] shrink-0 rounded-full border-2 border-workly-primary/18 object-cover"
              />
              <div className="min-w-0">
                <div className="mb-[3px] flex items-center justify-between gap-2.5">
                  <h4 className="font-extrabold">{lead.cliente?.nome || 'Cliente'}</h4>
                  <span className="shrink-0 rounded-full bg-workly-primary/12 px-2.5 py-[5px] text-[0.8rem] font-extrabold text-workly-primary">
                    {formatContractStatus(lead.status)}
                  </span>
                </div>
                <p className="mb-1.5 text-[0.86rem] font-extrabold text-workly-primary">
                  {lead.tipoContratacao === 'fixo' ? 'Contratação direta' : 'Proposta recebida'} ·{' '}
                  {lead.nomeServico || lead.nome_servico || 'Serviço'}
                </p>
                <p className="mt-1 mb-2.5 text-[0.84rem] leading-[1.45] text-[#64748b] dark:text-[#a9b9cf]">
                  {lead.mensagem || 'Sem mensagem enviada.'}
                </p>
                <div className="flex flex-wrap gap-2 text-[0.78rem] text-[#9e9e9e] [&>span]:rounded-full [&>span]:bg-workly-primary/8 [&>span]:px-2 [&>span]:py-[5px]">
                  <span>
                    <i className="fas fa-money-bill-wave" aria-hidden="true" />{' '}
                    {lead.tipoContratacao === 'combinar' && !lead.preco && !lead.precoProposto
                      ? 'Valor a combinar'
                      : lead.precoProposto || lead.preco_proposto || lead.preco
                        ? formatCurrency(lead.precoProposto || lead.preco_proposto || lead.preco)
                        : 'Sem valor definido'}
                  </span>
                  <span>
                    <i className="fas fa-calendar" aria-hidden="true" />{' '}
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                  </span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState className={emptyPanel}>
            <h4>Nenhum lead ainda</h4>
            <p>As propostas recebidas aparecerão aqui automaticamente.</p>
          </EmptyState>
        )}
      </section>
      <section className={`${panel} p-[25px]`}>
        <h3 className={title}>Distribuição de Receita</h3>
        <Chart id="revenueChart" config={revenueConfig} data={revenueData} />
        <div className="mt-4 grid gap-2.5">
          {(distribution.empty ? ['Sem receita confirmada ainda'] : distribution.labels || []).map(
            (label, index) => (
              <div
                key={index}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border border-[#94a3b8]/16 bg-[#f4f7fb] px-3 py-[11px] dark:bg-[#0f172a]/70"
              >
                <span className="truncate">{label}</span>
                <strong className="text-workly-primary">
                  {formatCurrency(distribution.empty ? 0 : distribution.data[index] || 0)}
                </strong>
              </div>
            )
          )}
        </div>
      </section>
      <section className={`${panel} p-[25px]`}>
        <h3 className={title}>Atividades Recentes</h3>
        {dashboard.recentActivities?.length ? (
          dashboard.recentActivities.slice(0, 3).map((activity, index) => (
            <article
              key={index}
              className="flex min-w-0 items-start gap-3 border-b border-[#e0e0e0] py-[14px] dark:border-white/8"
            >
              <i
                aria-hidden="true"
                className={`fas ${activity.icon || 'fa-bell'} grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-workly-primary/12 text-workly-primary`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-extrabold">{activity.titulo || 'Atividade'}</p>
                  {activity.status && (
                    <span className="shrink-0 rounded-full bg-workly-primary/12 px-[9px] py-[5px] text-[0.78rem] font-extrabold text-[#049b45]">
                      {activity.status}
                    </span>
                  )}
                </div>
                {activity.descricao && (
                  <p className="text-sm text-[#64748b] dark:text-[#a9b9cf]">{activity.descricao}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-[0.8rem] text-[#9e9e9e]">
                  <span>{activityDate(activity.date)}</span>
                  {Number(activity.valor) > 0 && (
                    <strong className="rounded-full bg-[#0f172a]/6 px-[9px] py-[5px] text-[0.78rem] font-extrabold text-[#334155]">
                      {formatCurrency(activity.valor)}
                    </strong>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState className={emptyPanel}>
            <h4>Nenhuma atividade recente</h4>
            <p>
              Contratos, avaliações, favoritos e serviços publicados aparecerão aqui
              automaticamente.
            </p>
          </EmptyState>
        )}
      </section>
      <section className={`${panel} p-[25px]`}>
        <h3 className={title}>Atividade da Semana</h3>
        <Chart
          id="viewsChart"
          config={viewsConfig}
          data={{
            labels: weekly.labels || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [
              {
                label: 'Atividades',
                data: weekly.data || [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(34, 197, 94, 0.85)'
              }
            ]
          }}
        />
      </section>
    </div>
  );
}
