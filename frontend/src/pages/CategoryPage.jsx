import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import ServiceCard from '../components/catalog/ServiceCard';
import { ErrorState, EmptyState } from '../components/ui/Feedback';
import { categories, categoryServices } from '../services/catalogService';

export default function CategoryPage() {
  const [params] = useSearchParams(),
    id = params.get('id');
  const category = categories.find((item) => item.id === id);
  const [services, setServices] = useState(null),
    [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setServices(null);
    setError(false);
    categoryServices(id, { signal: controller.signal })
      .then(setServices)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, [id]);
  const empty =
    'my-[18px] w-full max-w-[420px] rounded-[28px] bg-transparent px-7 py-8 text-center [&_i]:mb-[18px] [&_i]:inline-flex [&_i]:h-[74px] [&_i]:w-[74px] [&_i]:items-center [&_i]:justify-center [&_i]:rounded-full [&_i]:bg-workly-primary-glow/12 [&_i]:text-[2rem] [&_i]:text-workly-primary-glow [&_i]:opacity-90 [&_h2]:mb-4 [&_h2]:text-[2rem] [&_h2]:leading-[1.12] [&_h2]:font-semibold [&_h2]:text-[#0f172a] [&_p]:mb-6 [&_p]:text-[1.1rem] [&_p]:leading-[1.6] [&_p]:text-[#64748b] dark:[&_h2]:text-[#eef5ff] dark:[&_p]:text-[#9fb0c7]';
  return (
    <CatalogShell title={category ? `Workly - ${category.name}` : 'Workly - Categoria'}>
      <div className="mx-auto my-[30px] w-[90%] max-w-[1200px] p-5">
        <div className="relative mb-10 overflow-hidden rounded-[28px] border border-[rgba(148,163,184,0.10)] shadow-[0_18px_40px_rgba(16,180,74,0.18)] backdrop-blur-[10px] bg-[linear-gradient(135deg,#10b44a,#09a63d)] px-6 py-14 dark:px-5 dark:shadow-none text-center text-white dark:bg-none dark:border-transparent dark:text-workly-dark-text">
          <h1
            id="category-name"
            className="relative z-[1] text-[2.8rem] font-bold [text-shadow:0_2px_12px_rgba(0,0,0,0.14)] legacy-max-768:text-[2rem] dark:text-[#4ade80] dark:[text-shadow:none]"
          >
            {category?.name || ''}
          </h1>
          <p
            id="category-description"
            className="relative z-[1] mx-auto mt-[15px] max-w-[700px] leading-[normal] text-[1.3rem] text-white/94 legacy-max-768:text-base dark:text-white/88"
          >
            {category?.description || ''}
          </p>
        </div>
        <div className="my-10 flex justify-center gap-5 legacy-max-480:justify-start legacy-max-480:flex-nowrap legacy-max-480:overflow-x-auto legacy-max-480:pb-2.5" />
      </div>
      <section className="mx-auto mt-5 mb-[60px] max-w-[1200px] border-0 bg-transparent px-5">
        <div className="mb-10 text-center">
          <h2 className="mb-2.5 text-[2rem] font-bold text-[#1d1d1d] legacy-max-576:text-[1.6rem] dark:text-workly-dark-text">
            Serviços Populares
          </h2>
          <p className="leading-[normal] text-[1.1rem] text-[#474747] legacy-max-576:text-base dark:text-workly-dark-text">
            Os serviços mais solicitados pelos clientes
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-[1800px] grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-[45px] p-[15px]">
          {error ? (
            <ErrorState className={empty}>
              <i aria-hidden="true" className="fa-solid fa-circle-info" />
              <h2 className="font-bold">Não foi possível carregar os serviços</h2>
              <p>Tente novamente em instantes.</p>
            </ErrorState>
          ) : services && !services.length ? (
            <EmptyState className={empty}>
              <i aria-hidden="true" className="fa-solid fa-circle-info" />
              <h2 className="font-bold">Nenhum serviço disponível</h2>
              <p>
                Parece que ainda não há serviços cadastrados nesta categoria. Volte mais tarde ou
                explore outras categorias.
              </p>
              <Link
                to="/anuncio"
                className="inline-block min-h-12 min-w-[190px] rounded-xl bg-workly-primary px-[25px] py-3 font-semibold text-white shadow-[0_14px_30px_rgba(15,206,106,0.22)] dark:text-[#062311]"
              >
                Criar um serviço
              </Link>
            </EmptyState>
          ) : (
            services?.map((service, index) => (
              <ServiceCard key={service.idServico || index} service={service} />
            ))
          )}
        </div>
      </section>
      <div className="mt-10 text-center">
        <Link
          id="see-more-btn"
          to={category ? `/todos-servicos?id_categoria=${id}` : '#'}
          className="inline-block rounded bg-workly-primary px-[25px] py-3 font-semibold text-white hover:-translate-y-0.5 hover:bg-[#038a3d]"
        >
          Ver mais serviços <i aria-hidden="true" className="fas fa-arrow-right ml-[5px]" />
        </Link>
      </div>
    </CatalogShell>
  );
}
