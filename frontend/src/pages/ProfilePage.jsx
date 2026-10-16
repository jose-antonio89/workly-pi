import { useCallback, useEffect, useRef, useState } from 'react';
import { assignCovers } from '../components/home/offices';
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
import { removeService } from '../services/serviceEditorService';

export default function ProfilePage() {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [tab, setTab] = useState('Dashboard'),
    [photo, setPhoto] = useState(false),
    [removing, setRemoving] = useState(false);
  const removalInProgress = useRef(false);
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
  async function removeAnnouncement(service) {
    if (removalInProgress.current) return;
    removalInProgress.current = true;
    setRemoving(true);
    try {
      const confirmation = await showAuthAlert({
        icon: 'warning',
        title: 'Remover anúncio?',
        text: 'Ele sairá do catálogo. Contratos e avaliações anteriores serão preservados. Anúncios com contratos ativos não podem ser removidos.',
        danger: true,
        confirmText: 'Remover anúncio',
        cancelText: 'Cancelar',
        onConfirm: async () => {
          try { await removeService(service.idServico); }
          catch (error) { return error.message || 'Não foi possível remover o anúncio.'; }
        }
      });
      if (confirmation.isConfirmed) {
        await reload();
        await showAuthAlert({ icon: 'success', title: 'Anúncio removido', text: 'O anúncio não aparece mais no catálogo.' });
      }
    } finally {
      removalInProgress.current = false;
      setRemoving(false);
    }
  }
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
              className="mb-8 flex gap-1 overflow-x-auto border-b border-workly-rule [scrollbar-width:none]"
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
                  className={`relative -mb-px shrink-0 border-b-2 px-4 py-3 text-[0.95rem] font-semibold whitespace-nowrap transition-colors ${tab === label ? 'border-workly-forest text-workly-ink-warm dark:border-workly-dark-accent' : 'border-transparent text-workly-muted-warm hover:text-workly-ink-warm'}`}
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
                <h2 className="text-[1.375rem] font-semibold text-workly-ink-warm">
                  Meus Serviços
                  {String(data.user.tipoConta).toLowerCase().includes('contratante') && (
                    <span className="text-[0.9rem] font-medium text-workly-muted-warm">
                      {' '}
                      — opcional para contas contratantes
                    </span>
                  )}
                </h2>
                <Link
                  to="/anuncio"
                  className="rounded-lg bg-workly-forest px-5 py-3 font-semibold text-white"
                >
                  <i aria-hidden="true" className="fas fa-plus" /> Adicionar Serviço
                </Link>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-x-6 gap-y-10">
                {data.services.length ? (
                  data.services.map((service, index) => (
                    <ServiceCard key={service.idServico} service={service} cover={assignCovers(data.services)[index]} owner onRemove={removeAnnouncement} removing={removing} />
                  ))
                ) : (
                  <EmptyState className="py-5 text-center">
                    Você ainda não publicou nenhum serviço.
                  </EmptyState>
                )}
              </div>
            </section>
            <section id="reviews-tab" role="tabpanel" hidden={tab !== 'Avaliações'}>
              <h2 className="mb-[30px] text-[1.375rem] font-semibold text-workly-ink-warm">
                Avaliações dos Clientes
              </h2>
              <div className={`${panel} mb-[30px] p-[25px] flex flex-wrap gap-[30px]`}>
                <div className="text-center">
                  <strong className="block text-[3rem] font-bold text-workly-primary-ink">
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
                        <div className="h-2 overflow-hidden rounded-full bg-[#ddd8cc] dark:bg-[#24302a]">
                          <span
                            className="block h-full bg-workly-forest"
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
                        <p className="text-sm text-workly-muted-warm">
                          {review.servico?.nome || 'Serviço avaliado'}
                        </p>
                      </div>
                      <span className="text-xs text-workly-muted-warm">
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
              className="mt-2.5 w-full min-w-0"
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
