import Button from '../ui/Button';
import { categories } from '../../services/catalogService';

const field =
  'flex h-12 min-w-0 items-center gap-2.5 overflow-hidden rounded-[14px] border border-[rgba(148,163,184,.24)] bg-white px-[13px] shadow-[0_8px_18px_rgba(15,23,42,.045)] focus-within:ring-2 focus-within:ring-workly-primary dark:border-[rgba(94,130,172,.24)] dark:bg-[rgba(10,18,34,.92)]';
const input =
  'h-[46px] w-full min-w-0 border-0 bg-transparent p-0 text-[.92rem] font-extrabold text-[#0f172a] outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-workly-primary placeholder:font-semibold placeholder:text-[#8b9ab0] dark:text-workly-dark-text dark:placeholder:text-[#94a3b8]';

export default function ServiceFilters({ filters, onChange, onSubmit }) {
  function control(key, icon, area, children) {
    const areas = {
      search: '[grid-area:search]',
      category: '[grid-area:category]',
      min: '[grid-area:min]',
      max: '[grid-area:max]',
      rating: '[grid-area:rating]',
      sort: '[grid-area:sort]'
    };
    return (
      <div className={`${field} ${areas[area]}`}>
        <i
          aria-hidden="true"
          className={`fas ${icon} w-4 shrink-0 text-center text-[.9rem] text-workly-primary`}
        />
        {children}
      </div>
    );
  }
  const props = (key) => ({
    id: `filter${{ q: 'Search', categoria: 'Category', min: 'Min', max: 'Max', avaliacaoMin: 'Rating', ordenar: 'Sort' }[key]}`,
    value: filters[key],
    onChange: (event) => onChange({ ...filters, [key]: event.target.value }),
    className: input
  });
  return (
    <form
      onSubmit={onSubmit}
      id="servicesFilterForm"
      className="mx-auto mt-6 grid w-full max-w-[1040px] grid-cols-[1.15fr_1.15fr_1fr_1fr_1fr_1fr] [grid-template-areas:'search_search_category_category_min_max'_'rating_rating_sort_sort_actions_actions'] gap-3 rounded-[22px] border border-[rgba(148,163,184,.18)] bg-[linear-gradient(180deg,rgba(255,255,255,.80),rgba(244,248,252,.94))] p-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,.88),0_18px_42px_rgba(15,23,42,.07)] legacy-max-1180:max-w-[860px] legacy-max-1180:grid-cols-4 legacy-max-1180:[grid-template-areas:'search_search_search_search'_'category_category_rating_rating'_'min_max_sort_sort'_'actions_actions_actions_actions'] legacy-max-680:grid-cols-1 legacy-max-680:[grid-template-areas:'search'_'category'_'min'_'max'_'rating'_'sort'_'actions'] legacy-max-680:rounded-[18px] legacy-max-680:p-3 dark:border-[rgba(94,130,172,.22)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,.62),rgba(10,18,34,.78))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,.035),0_18px_46px_rgba(0,4,18,.36)]"
    >
      {control(
        'q',
        'fa-search',
        'search',
        <input
          {...props('q')}
          type="search"
          aria-label="Buscar serviço"
          placeholder="Buscar serviço..."
        />
      )}
      {control(
        'categoria',
        'fa-layer-group',
        'category',
        <select {...props('categoria')} aria-label="Categoria" className={`${input} font-[650]`}>
          <option value="">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.navName || item.name}
            </option>
          ))}
        </select>
      )}
      {control(
        'min',
        'fa-dollar-sign',
        'min',
        <input
          {...props('min')}
          type="number"
          aria-label="Preço mínimo"
          placeholder="Mínimo"
          min="0"
          step="0.01"
        />
      )}
      {control(
        'max',
        'fa-dollar-sign',
        'max',
        <input
          {...props('max')}
          type="number"
          aria-label="Preço máximo"
          placeholder="Máximo"
          min="0"
          step="0.01"
        />
      )}
      {control(
        'avaliacaoMin',
        'fa-star',
        'rating',
        <select
          {...props('avaliacaoMin')}
          aria-label="Avaliação mínima"
          className={`${input} font-[650]`}
        >
          <option value="">Qualquer avaliação</option>
          <option value="4.5">4,5+</option>
          <option value="4">4,0+</option>
          <option value="3">3,0+</option>
        </select>
      )}
      {control(
        'ordenar',
        'fa-arrow-down-wide-short',
        'sort',
        <select {...props('ordenar')} aria-label="Ordenação" className={`${input} font-[650]`}>
          <option value="recentes">Mais recentes</option>
          <option value="preco_asc">Menor preço</option>
          <option value="preco_desc">Maior preço</option>
          <option value="avaliacao">Melhor avaliação</option>
        </select>
      )}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(100px,.58fr)] [grid-area:actions] gap-2.5 legacy-max-680:grid-cols-1">
        <Button
          appearance="custom"
          type="submit"
          className="h-12 rounded-[14px] bg-[linear-gradient(135deg,#13ce66,#04BF55)] px-[18px] text-[13.3333px] font-black text-white shadow-[0_12px_24px_rgba(4,191,85,.20)] focus-visible:outline-2 focus-visible:outline-workly-primary"
        >
          <i aria-hidden="true" className="fas fa-filter" /> Filtrar
        </Button>
        <a
          href="/todos-servicos"
          className="inline-flex h-12 items-center justify-center rounded-[14px] border border-[rgba(148,163,184,.18)] bg-[#e8eef5] px-[14px] font-black text-[#526174] focus-visible:outline-2 focus-visible:outline-workly-primary dark:text-[#eef5ff]"
        >
          Limpar
        </a>
      </div>
    </form>
  );
}
