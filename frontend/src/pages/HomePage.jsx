import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import ServiceCard from '../components/catalog/ServiceCard';
import Button from '../components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/Feedback';
import { featuredServices } from '../services/catalogService';

export default function HomePage() {
  const navigate = useNavigate(),
    [services, setServices] = useState(null),
    [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    featuredServices({ signal: controller.signal })
      .then(setServices)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, []);
  function search(event) {
    event.preventDefault();
    const term = new FormData(event.currentTarget).get('q').trim();
    navigate(term ? `/todos-servicos?q=${encodeURIComponent(term)}` : '/todos-servicos');
  }
  const state =
    'shadow-[0_12px_36px_rgba(15,23,42,0.08)] [&_h3]:text-[18.72px] dark:border dark:border-[rgba(148,163,184,0.08)] dark:bg-[linear-gradient(180deg,rgba(11,18,32,0.78),rgba(14,24,40,0.72))] dark:text-[#eaf2ff] dark:shadow-[0_14px_34px_rgba(0,0,0,0.18)] dark:[&_h3]:text-[#eef5ff] dark:[&_p]:text-[#9fb0c7]';
  return (
    <CatalogShell title="Workly - Encontre Freelancers">
      <main>
        <section className="relative z-[1] overflow-hidden bg-[linear-gradient(135deg,#04bf55,#2196f3)] px-5 py-[100px] text-center text-white legacy-max-480:px-[15px] legacy-max-480:py-[70px] dark:bg-none dark:text-workly-dark-text dark:shadow-[0_20px_52px_rgba(0,4,18,0.55)]">
          <div className="mx-auto max-w-[800px]">
            <h1 className="mb-5 text-[3.5rem] font-bold legacy-max-768:text-[2.5rem] legacy-max-480:text-[2rem] dark:text-workly-dark-accent">
              Encontre os melhores freelancers para o seu projeto.
            </h1>
            <p className="mb-10 leading-[normal] text-2xl legacy-max-768:text-[1.2rem] legacy-max-480:text-base dark:text-workly-dark-text">
              Milhares de profissionais talentosos prontos para trabalhar com você.
            </p>
            <form
              onSubmit={search}
              className="mx-auto flex max-w-[600px] justify-center legacy-max-480:flex-col"
            >
              <input
                name="q"
                aria-label="Qual serviço você está procurando?"
                placeholder="Qual serviço você está procurando?"
                className="w-full min-w-0 rounded-l-[30px] border-0 bg-white px-[25px] py-[15px] text-[1.1rem] text-black outline-none focus-visible:ring-2 focus-visible:ring-workly-primary legacy-max-480:mb-2.5 legacy-max-480:rounded-[30px] dark:border dark:border-[rgba(94,130,172,0.28)] dark:bg-[rgba(10,18,34,0.92)] dark:text-workly-dark-text"
              />
              <Button
                appearance="custom"
                type="submit"
                className="rounded-r-[30px] bg-[#038a3d] px-[30px] py-[15px] text-[1.1rem] text-white hover:bg-[#6ad99a] focus-visible:outline-2 focus-visible:outline-white legacy-max-480:rounded-[30px]"
              >
                Buscar
              </Button>
            </form>
          </div>
        </section>
        <section className="bg-transparent px-5 py-[60px] dark:pt-[72px]">
          <h2 className="mb-10 text-center text-[2.5rem] font-bold dark:text-workly-dark-accent">
            Serviços em Destaque
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] items-stretch gap-[25px] py-5">
            {error ? (
              <ErrorState className={state}>
                <h3 className="font-bold">Não foi possível carregar</h3>
                <p>Tente novamente em alguns instantes.</p>
              </ErrorState>
            ) : !services ? (
              <LoadingState message="Buscando serviços bem avaliados..." />
            ) : !services.length ? (
              <EmptyState className={`col-span-full ${state}`}>
                <h3 className="font-bold">Sem destaques ainda</h3>
                <p>
                  Os serviços com avaliação igual ou maior que 4,5 aparecerão aqui automaticamente.
                </p>
                <Link
                  to="/todos-servicos"
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-workly-primary/10 px-[14px] font-extrabold text-workly-primary"
                >
                  Ver todos os serviços
                </Link>
              </EmptyState>
            ) : (
              services.map((service, index) => (
                <ServiceCard key={service.idServico || index} service={service} featured />
              ))
            )}
          </div>
        </section>
      </main>
    </CatalogShell>
  );
}
