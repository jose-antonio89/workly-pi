import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import ServiceCard from '../components/catalog/ServiceCard';
import ProfileHeader, { panel, emptyPanel, Stars } from '../components/profile/ProfileHeader';
import { LoadingState, EmptyState } from '../components/ui/Feedback';
import { readProfile } from '../services/profileService';
import { showAuthAlert } from '../components/auth/authPresentation';

export default function PublicProfilePage() {
  const [params] = useSearchParams(),
    id = params.get('id'),
    navigate = useNavigate();
  const [data, setData] = useState(null);
  useEffect(() => {
    let active = true;
    if (!id) {
      navigate('/todos-servicos', { replace: true });
      return;
    }
    readProfile(id)
      .then((value) => {
        if (active) setData(value);
      })
      .catch(async (error) => {
        if (!active) return;
        await showAuthAlert({
          icon: 'error',
          title: 'Perfil não encontrado',
          text: error.message || 'Não foi possível carregar este perfil.'
        });
        if (active) navigate('/todos-servicos', { replace: true });
      });
    return () => {
      active = false;
    };
  }, [id, navigate]);
  const contractor =
    data &&
    String(data.user.tipoConta || '')
      .toLowerCase()
      .includes('contratante') &&
    !data.services.length;
  return (
    <CatalogShell title={`Workly - ${data?.user.nome || 'Perfil público'}`} footer={false}>
      <main className="mx-auto mt-9 mb-[70px] w-[calc(100%-32px)] max-w-[1180px]">
        {!data ? (
          <LoadingState message="Carregando perfil público..." />
        ) : (
          <>
            <ProfileHeader {...data} summary={data.reviewSummary} publicProfile />
            {contractor ? (
              <section
                className={`${panel} mt-6 rounded-[28px]! bg-white/78! p-7 dark:bg-transparent!`}
              >
                <h2 className="mb-[18px] text-2xl [line-height:normal] font-bold">
                  Perfil de contratante
                </h2>
                <p>
                  Este usuário usa a Workly principalmente para contratar profissionais. Por isso, o
                  perfil público mostra apenas as informações essenciais.
                </p>
              </section>
            ) : (
              <section
                className={`${panel} mt-6 rounded-[28px]! bg-white/78! p-7 dark:bg-transparent!`}
              >
                <h2 className="mb-[18px] text-2xl [line-height:normal] font-bold">
                  Serviços publicados
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-[25px]">
                  {data.services.length ? (
                    data.services.map((service) => (
                      <ServiceCard key={service.idServico} service={service} />
                    ))
                  ) : (
                    <EmptyState className={emptyPanel}>
                      <h3>Nenhum serviço publicado</h3>
                      <p>Este usuário ainda não possui serviços públicos.</p>
                    </EmptyState>
                  )}
                </div>
              </section>
            )}
            <section
              className={`${panel} mt-6 rounded-[28px]! bg-white/78! p-7 dark:bg-transparent!`}
            >
              <h2 className="mb-[18px] text-2xl [line-height:normal] font-bold">
                Avaliações recebidas
              </h2>
              <div className="mt-[30px]">
                {data.reviews.length ? (
                  data.reviews.map((review, index) => (
                    <article
                      key={review._id || index}
                      className="animate-workly-legacy-in mb-5 rounded-[15px] border border-[#e0e0e0] bg-white p-[25px] dark:border-[#94a3b8]/18 dark:bg-transparent"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <strong>{review.autor?.nome || 'Cliente'}</strong>
                        <span>
                          <Stars value={review.notaFreelancer} round />
                        </span>
                      </div>
                      <p>{review.comentario || 'Sem comentário.'}</p>
                      <small className="text-[13.3333px]">
                        {review.servico?.nome || 'Serviço avaliado'}
                      </small>
                    </article>
                  ))
                ) : (
                  <EmptyState className={emptyPanel}>
                    <h3>Sem avaliações</h3>
                    <p>As avaliações recebidas aparecerão aqui.</p>
                  </EmptyState>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </CatalogShell>
  );
}
