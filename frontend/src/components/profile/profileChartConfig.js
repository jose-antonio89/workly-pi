export const salesConfig = () => ({
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

export const revenueConfig = () => ({
  type: 'doughnut',
  data: {
    labels: ['Sem receita ainda'],
    datasets: [
      {
        data: [1],
        backgroundColor: ['rgba(148, 163, 184, 0.35)'],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutoutPercentage: 70,
    legend: { position: 'bottom', labels: { fontColor: '#cbd5e1' } }
  }
});

export const viewsConfig = () => ({
  type: 'bar',
  data: {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Atividades',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(34, 197, 94, 0.85)'
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    legend: { display: false },
    scales: {
      yAxes: [
        {
          ticks: { beginAtZero: true, precision: 0, fontColor: '#94a3b8' },
          gridLines: { color: 'rgba(148, 163, 184, 0.10)' }
        }
      ],
      xAxes: [
        { ticks: { fontColor: '#94a3b8' }, gridLines: { color: 'rgba(148, 163, 184, 0.08)' } }
      ]
    }
  }
});
