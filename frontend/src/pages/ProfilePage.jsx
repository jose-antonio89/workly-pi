import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import ServiceCard from '../components/catalog/ServiceCard';
import ProfileHeader, { panel, emptyPanel, Stars } from '../components/profile/ProfileHeader';
import ProfileSettings from '../components/profile/ProfileSettings';
import ProfileDashboard from '../components/profile/ProfileDashboard';
import PhotoModal from '../components/profile/PhotoModal';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/Feedback';
import { readProfile } from '../services/profileService';
import { defaultProfileImage } from '../services/catalogService';
import { showAuthAlert } from '../components/auth/authPresentation';

export default function ProfilePage() {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [tab, setTab] = useState('Dashboard'),
    [photo, setPhoto] = useState(false);
  const reload = useCallback(async () => {
    try {
      setData(await readProfile());
      setError('');
    } catch (value) {
      setError(value.message || 'Erro ao carregar perfil.');
      await showAuthAlert({
        icon: 'error',
        title: 'Erro ao carregar perfil',
        text: value.message || 'Erro ao carregar perfil.',
        confirmText: 'Fechar'
      });
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  const rating = Number(data?.reviewSummary.mediaFreelancer || 0),
    total = Number(data?.reviewSummary.total ?? data?.reviews.length ?? 0),
    formatRating = (value) =>
      Number(value || 0) > 0 ? Number(value).toFixed(1).replace('.', ',') : '--';
  return (
    <CatalogShell title="Workly - Perfil">
      <main className="mx-auto my-10 max-w-[1200px] px-5">
        {!data ? (
          error ? (
            <ErrorState>{error}</ErrorState>
          ) : (
            <LoadingState message="Carregando perfil..." />
          )
        ) : (
          <>
            <ProfileHeader {...data} onPhoto={() => setPhoto(true)} />
            <div
              role="tablist"
              aria-label="Perfil"
              className="mb-[30px] flex overflow-hidden rounded-[10px] bg-white shadow-[0_5px_15px_rgba(0,0,0,0.05)] dark:border dark:border-[#94a3b8]/10 dark:bg-[#0f172a]/72"
            >
              {['Dashboard', 'Serviços', 'Avaliações', 'Configurações'].map((label) => (
                <button
                  key={label}
                  role="tab"
                  aria-selected={tab === label}
                  aria-controls={
                    label === 'Serviços'
                      ? 'services-tab'
                      : label === 'Avaliações'
                        ? 'reviews-tab'
                        : label === 'Configurações'
                          ? 'settings-tab'
                          : 'dashboard-tab'
                  }
                  onClick={(event) => {
                    setTab(label);
                    event.currentTarget.parentElement.scrollLeft = 0;
                  }}
                  className={`flex-1 px-[25px] py-[15px] text-center font-semibold focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-workly-primary legacy-max-480:px-[15px] legacy-max-480:py-2.5 legacy-max-480:text-[0.9rem] ${tab === label ? 'bg-workly-primary text-white dark:bg-[linear-gradient(135deg,#22c55e,#16a34a)] dark:text-[#07111f]' : 'hover:bg-[#e4e4e4] dark:text-workly-dark-text dark:hover:bg-[#22c55e]/8'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div id="dashboard-tab" role="tabpanel" hidden={tab !== 'Dashboard'}>
              {tab === 'Dashboard' && <ProfileDashboard data={data} />}
            </div>
            <section id="services-tab" role="tabpanel" hidden={tab !== 'Serviços'}>
              <div className="mb-[30px] flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-workly-primary">
                  Meus Serviços
                  {String(data.user.tipoConta).toLowerCase().includes('contratante') && (
                    <span className="text-[0.9rem] font-medium text-[#64748b]">
                      {' '}
                      — opcional para contas contratantes
                    </span>
                  )}
                </h2>
                <Link
                  to="/anuncio"
                  className="rounded-lg bg-workly-primary px-5 py-3 font-semibold text-white"
                >
                  <i aria-hidden="true" className="fas fa-plus" /> Adicionar Serviço
                </Link>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-[25px]">
                {data.services.length ? (
                  data.services.map((service) => (
                    <ServiceCard key={service.idServico} service={service} owner />
                  ))
                ) : (
                  <EmptyState className="py-5 text-center">
                    Você ainda não publicou nenhum serviço.
                  </EmptyState>
                )}
              </div>
            </section>
            <section id="reviews-tab" role="tabpanel" hidden={tab !== 'Avaliações'}>
              <h2 className="mb-[30px] text-2xl font-bold text-workly-primary">
                Avaliações dos Clientes
              </h2>
              <div className={`${panel} mb-[30px] p-[25px] flex flex-wrap gap-[30px]`}>
                <div className="text-center">
                  <strong className="block text-[3rem] font-bold text-workly-primary">
                    {formatRating(rating)}
                  </strong>
                  <Stars value={rating} />
                  <p className="mt-2 text-sm">
                    {total === 1 ? '1 avaliação recebida' : total + ' avaliações recebidas'}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  {total ? (
                    [5, 4, 3, 2, 1].map((note) => (
                      <div
                        key={note}
                        className="mb-2 grid grid-cols-[40px_minmax(0,1fr)_30px] items-center gap-3"
                      >
                        <span>
                          {note} <i aria-hidden="true" className="fas fa-star text-[#f59e0b]" />
                        </span>
                        <div className="h-2 overflow-hidden rounded-full bg-[#e4e4e4] dark:bg-[#1e293b]">
                          <span
                            className="block h-full bg-workly-primary"
                            style={{
                              width:
                                Math.round(
                                  (Number(data.reviewSummary.distribuicao?.[note] || 0) / total) *
                                    100
                                ) + '%'
                            }}
                          />
                        </div>
                        <strong>{data.reviewSummary.distribuicao?.[note] || 0}</strong>
                      </div>
                    ))
                  ) : (
                    <p>As avaliações reais recebidas aparecerão aqui automaticamente.</p>
                  )}
                </div>
              </div>
              {data.reviews.length ? (
                data.reviews.map((review, index) => (
                  <article
                    key={review._id || index}
                    className={`${panel} animate-workly-legacy-in mb-5 p-[25px]`}
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <img
                        src={review.autor?.fotoPerfil || defaultProfileImage}
                        alt="Foto do cliente"
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold">{review.autor?.nome || 'Cliente'}</h4>
                        <p className="text-sm text-[#64748b]">
                          {review.servico?.nome || 'Serviço avaliado'}
                        </p>
                      </div>
                      <span className="text-xs text-[#64748b]">
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString('pt-BR')
                          : ''}
                      </span>
                    </div>
                    <Stars value={review.notaFreelancer} />
                    <p className="my-3">{review.comentario || 'Sem comentário.'}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span>Freelancer: {formatRating(review.notaFreelancer)}</span>
                      <span>Serviço: {formatRating(review.notaServico)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState className={emptyPanel}>
                  <h3>Nenhuma avaliação recebida ainda</h3>
                  <p>
                    Quando um contratante finalizar e avaliar um contrato, o comentário aparecerá
                    aqui.
                  </p>
                </EmptyState>
              )}
            </section>
            <section
              id="settings-tab"
              role="tabpanel"
              hidden={tab !== 'Configurações'}
              className="relative left-1/2 mt-2.5 w-screen -translate-x-1/2 p-[25px] pt-[35px]"
            >
              <ProfileSettings user={data.user} reload={reload} onPhoto={() => setPhoto(true)} />
            </section>
            {photo && <PhotoModal close={() => setPhoto(false)} reload={reload} />}
          </>
        )}
      </main>
    </CatalogShell>
  );
}
