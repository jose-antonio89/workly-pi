import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import ServiceCard from '../components/catalog/ServiceCard';
import ServiceFilters from '../components/catalog/ServiceFilters';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/Feedback';
import {
  readServiceFilters,
  searchServices,
  serviceSearchParams,
  serviceSearchTitle
} from '../services/serviceSearchService';

const empty =
  'my-[18px] w-full max-w-[420px] rounded-[28px] px-7 py-8 text-center [&_i]:mb-[18px] [&_i]:inline-flex [&_i]:size-[74px] [&_i]:items-center [&_i]:justify-center [&_i]:rounded-full [&_i]:bg-workly-primary-glow/12 [&_i]:text-[2rem] [&_i]:text-workly-primary-glow [&_h2]:mb-4 [&_h2]:text-[2rem] [&_h2]:font-bold [&_h2]:leading-[1.12] [&_h2]:text-[#0f172a] [&_p]:mb-6 [&_p]:text-[#64748b] dark:[&_h2]:text-workly-dark-text dark:[&_p]:text-[#9fb0c7]';

export default function AllServicesPage() {
  const location = useLocation(),
    navigate = useNavigate();
  const original = useRef(new URLSearchParams(location.search));
  const [filters, setFilters] = useState(() => readServiceFilters(original.current));
  const [request, setRequest] = useState(filters),
    [services, setServices] = useState(null),
    [error, setError] = useState(false);
  const [title, setTitle] = useState(() => serviceSearchTitle(filters, original.current));
  const submittedSearch = useRef(location.search);
  useEffect(() => {
    if (location.search === submittedSearch.current) return;
    submittedSearch.current = location.search;
    original.current = new URLSearchParams(location.search);
    const next = readServiceFilters(original.current);
    setFilters(next);
    setRequest(next);
    setTitle(serviceSearchTitle(next, original.current));
  }, [location.search]);
  useEffect(() => {
    const controller = new AbortController();
    setServices(null);
    setError(false);
    searchServices(request, { signal: controller.signal })
      .then(setServices)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, [request]);
  function submit(event) {
    event.preventDefault();
    setTitle(serviceSearchTitle(filters, original.current));
    setRequest({ ...filters });
    submittedSearch.current = `?${serviceSearchParams(filters)}`;
    navigate(`/todos-servicos${submittedSearch.current}`, { replace: true });
  }
  return (
    <CatalogShell title={title.title} footer={false}>
      <section className="mx-auto mt-[34px] mb-[22px] w-[calc(100%-32px)] max-w-[1180px] rounded-[26px] border border-[rgba(148,163,184,.18)] bg-[radial-gradient(circle_at_12%_0%,rgba(4,191,85,.10),transparent_30%),linear-gradient(rgba(255,255,255,.90),rgba(255,255,255,.90))] px-[34px] pt-[34px] pb-[30px] text-center shadow-[0_18px_48px_rgba(15,23,42,.075)] legacy-max-680:w-[calc(100%-24px)] legacy-max-680:rounded-[22px] legacy-max-680:px-4 legacy-max-680:pt-[26px] legacy-max-680:pb-[22px] dark:border-[rgba(94,130,172,.20)] dark:bg-[radial-gradient(circle_at_12%_0%,rgba(74,222,128,.12),transparent_30%),linear-gradient(160deg,rgba(14,25,42,.94),rgba(10,18,34,.90))] dark:shadow-[0_22px_64px_rgba(0,4,18,.38)]">
        <h1
          id="category-title"
          className="mb-2 text-[2.75rem] font-black text-workly-primary legacy-max-800:text-[2rem] break-words [letter-spacing:-0.04em]!"
        >
          {title.heading}
        </h1>
        <p className="mx-auto mb-[22px] max-w-[640px] font-semibold text-[#64748b] dark:text-[#a9b9cf]">
          Refine sua busca por categoria, preço, avaliação e ordenação.
        </p>
        <ServiceFilters filters={filters} onChange={setFilters} onSubmit={submit} />
      </section>
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] items-stretch gap-7 p-[15px] [&>article]:mx-auto">
        {error ? (
          <ErrorState className={empty}>
            <i aria-hidden="true" className="fas fa-triangle-exclamation" />
            <h2>Erro ao carregar</h2>
            <p>Tente novamente em alguns instantes.</p>
          </ErrorState>
        ) : !services ? (
          <LoadingState message="Carregando serviços..." />
        ) : !services.length ? (
          <EmptyState className={empty}>
            <i aria-hidden="true" className="fas fa-search" />
            <h2>Nenhum serviço encontrado</h2>
            <p>Tente ajustar a busca, categoria ou filtros.</p>
            <Link
              to="/todos-servicos"
              reloadDocument
              className="inline-flex min-h-12 min-w-[190px] items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#0fce6a,#0aa85a)] px-5 font-bold text-[#062311]"
            >
              Limpar filtros
            </Link>
          </EmptyState>
        ) : (
          services.map((service) => <ServiceCard key={service.idServico} service={service} />)
        )}
      </div>
    </CatalogShell>
  );
}
