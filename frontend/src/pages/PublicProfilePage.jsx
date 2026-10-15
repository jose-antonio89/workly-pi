import { useEffect, useState } from 'react';
import { categoryLabel, defaultProfileImage } from '../services/catalogService';
import { assignCovers } from '../components/home/offices';
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
  const user = data?.user || {};
  const media = Number(data?.reviewSummary?.mediaFreelancer || 0),
    total = Number(data?.reviewSummary?.total || 0);
  const covers = data ? assignCovers(data.services) : [];
  return (
    <CatalogShell title={`Workly - ${user.nome || 'Perfil público'}`}>
      <main className="mx-auto max-w-[1280px] px-10 pt-10 pb-20 legacy-max-720:px-6 legacy-max-720:pt-6">
        {!data ? (
          <LoadingState message="Carregando perfil público…" />
        ) : (
          <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-6">
              <img
                id="publicAvatar"
                src={user.fotoPerfil || defaultProfileImage}
                alt="Foto de perfil"
                className="h-28 w-28 rounded-full border border-workly-rule bg-workly-sunken object-cover"
              />
              <h1
                id="publicName"
                className="mt-5 font-workly-display text-[clamp(2rem,3vw,2.5rem)] leading-[1.05] font-semibold tracking-[-0.02em] break-words text-workly-ink-warm [font-variation-settings:'opsz'_96]"
              >
                {user.nome || 'Usuário Workly'}
              </h1>
              <p className="mt-2 font-medium text-workly-ink-warm/85">
                {user.tituloProfissional ||
                  `${user.tipoConta || 'Usuário'}${user.areaAtuacao ? ' · ' + categoryLabel(user.areaAtuacao) : ''}`}
              </p>
              <p className="mt-4 leading-relaxed text-workly-muted-warm">
                {user.bio ||
                  (contractor
                    ? 'Contratante da plataforma Workly.'
                    : 'Este usuário ainda não adicionou uma biografia.')}
              </p>
              <dl className="mt-6 grid gap-3 border-t border-workly-rule pt-5 text-sm">
                {[
                  ['Serviços publicados', data.services.length],
                  ['Avaliação', total ? `${media.toFixed(1).replace('.', ',')} (${total})` : 'Sem avaliações'],
                  ['Tipo de conta', user.tipoConta || '--'],
                  ...(user.areaAtuacao ? [['Área', categoryLabel(user.areaAtuacao)]] : [])
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4">
                    <dt className="text-workly-muted-warm">{label}</dt>
                    <dd className="text-right font-semibold text-workly-ink-warm tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
            <div className="min-w-0">
              {contractor ? (
                <section className="border-t-2 border-workly-forest pt-5 dark:border-workly-dark-accent/60">
                  <h2 className="text-[1.375rem] font-semibold text-workly-ink-warm">Perfil de contratante</h2>
                  <p className="mt-3 max-w-[60ch] leading-relaxed text-workly-muted-warm">
                    Este usuário usa a Workly principalmente para contratar profissionais. Por isso, o perfil
                    público mostra apenas as informações essenciais.
                  </p>
                </section>
              ) : (
                <section className="border-t-2 border-workly-forest pt-5 dark:border-workly-dark-accent/60">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-workly-display text-[1.75rem] font-semibold text-workly-ink-warm [font-variation-settings:'opsz'_96]">
                      Portfólio de serviços
                    </h2>
                    <span className="text-sm text-workly-muted-warm tabular-nums">
                      {data.services.length} {data.services.length === 1 ? 'serviço' : 'serviços'}
                    </span>
                  </div>
                  {data.services.length ? (
                    <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2">
                      {data.services.map((service, index) => (
                        <ServiceCard key={service.idServico} service={service} cover={covers[index]} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState className={`${emptyPanel} mt-6`}>
                      <h3 className="font-semibold text-workly-ink-warm">Nenhum serviço publicado</h3>
                      <p>Este usuário ainda não possui serviços públicos.</p>
                    </EmptyState>
                  )}
                </section>
              )}
              <section className="mt-16 border-t-2 border-workly-forest pt-5 dark:border-workly-dark-accent/60">
                <h2 className="font-workly-display text-[1.75rem] font-semibold text-workly-ink-warm [font-variation-settings:'opsz'_96]">
                  Avaliações recebidas
                </h2>
                {data.reviews.length ? (
                  <ul className="mt-6 divide-y divide-workly-rule">
                    {data.reviews.map((review, index) => (
                      <li key={review._id || index} className="grid gap-2 py-6 first:pt-0">
                        <Stars value={review.notaFreelancer} round />
                        <p className="max-w-[64ch] text-[1.05rem] leading-relaxed text-workly-ink-warm">
                          {review.comentario || 'Sem comentário.'}
                        </p>
                        <p className="text-sm text-workly-muted-warm">
                          <span className="font-semibold text-workly-ink-warm">{review.autor?.nome || 'Cliente'}</span>
                          {' · '}
                          {review.servico?.nome || 'Serviço avaliado'}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState className={`${emptyPanel} mt-6`}>
                    <h3 className="font-semibold text-workly-ink-warm">Sem avaliações</h3>
                    <p>As avaliações recebidas aparecerão aqui.</p>
                  </EmptyState>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </CatalogShell>
  );
}
