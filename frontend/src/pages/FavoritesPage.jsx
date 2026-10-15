import { useCallback, useEffect, useState } from 'react';
import { serviceImage } from '../components/home/offices';
import CatalogShell from '../components/catalog/CatalogShell';
import { LoadingState } from '../components/ui/Feedback';
import {
  ModuleButton,
  ModuleEmpty,
  ModulePage,
  ModuleToast,
  moduleSurface,
  useModuleToast
} from '../components/ui/ModuleUI';
import { myFavorites } from '../services/favoriteService';
import { defaultServiceImage, formatCurrency, updateFavorite } from '../services/catalogService';

export default function FavoritesPage() {
  const [items, setItems] = useState(null),
    [error, setError] = useState(''),
    [message, toast] = useModuleToast();
  const load = useCallback(async () => {
    setItems(null);
    setError('');
    try {
      setItems(await myFavorites());
    } catch (error) {
      setError(error.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function remove(id) {
    try {
      await updateFavorite(id, true);
      toast('Removido dos favoritos');
      await load();
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <CatalogShell title="Favoritos" footer="empty">
      <ModulePage
        kicker={
          <>
            <i aria-hidden="true" className="fas fa-heart" />
            Lista salva
          </>
        }
        title="Favoritos"
        description="Serviços salvos para você comparar e contratar depois."
      >
        <section
          id="favoritos-list"
          className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-[22px] legacy-max-760:grid-cols-1"
        >
          {error ? (
            <ModuleEmpty
              error
              icon="fa-triangle-exclamation"
              title="Erro ao carregar"
              message={error}
            />
          ) : items === null ? (
            <LoadingState message="Carregando favoritos..." />
          ) : items.length ? (
            items
              .filter((f) => f.servico)
              .map((f) => {
                const s = f.servico;
                return (
                  <article
                    key={s.idServico}
                    data-favorite-id={s.idServico}
                    className={moduleSurface}
                  >
                    <img
                      src={serviceImage(s, defaultServiceImage)}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = defaultServiceImage;
                      }}
                      className="h-[170px] w-full bg-[#16211b] object-cover"
                    />
                    <div className="p-5">
                      <h3 className="mb-2 text-[1.15rem] font-bold">{s.nome}</h3>
                      <p className="mb-3.5 leading-[1.55] text-workly-muted-warm dark:text-[#9aa59f]">
                        {String(s.descricao || '').slice(0, 110)}
                      </p>
                      <div className="my-3 flex flex-wrap gap-2">
                        {[
                          ['fa-layer-group', s.nomeCategoria || 'Categoria'],
                          ['fa-user', s.nomeFreelancer || 'Freelancer']
                        ].map(([icon, text]) => (
                          <span
                            key={icon}
                            className="inline-flex items-center gap-1.5 rounded-full bg-workly-sunken px-2.5 py-[7px] text-[0.82rem] font-bold text-workly-ink-warm/80 dark:bg-[#1a2621] dark:text-[#ddd8cc]"
                          >
                            <i aria-hidden="true" className={`fas ${icon}`} />
                            {text}
                          </span>
                        ))}
                      </div>
                      <strong>
                        {s.valorCombinar ? 'Valor a combinar' : formatCurrency(s.preco)}
                      </strong>
                      <div className="mt-4 grid gap-2.5">
                        <ModuleButton to={`/detalhe-servico?id=${s.idServico}`}>
                          Ver serviço
                        </ModuleButton>
                        <ModuleButton tone="danger" onClick={() => remove(s.idServico)}>
                          <i aria-hidden="true" className="fas fa-trash" />
                          Remover
                        </ModuleButton>
                      </div>
                    </div>
                  </article>
                );
              })
          ) : (
            <ModuleEmpty
              icon="fa-heart"
              title="Nenhum favorito ainda"
              message="Salve serviços pela página de detalhes para acessar depois."
            >
              <ModuleButton to="/todos-servicos">Ver serviços</ModuleButton>
            </ModuleEmpty>
          )}
        </section>
      </ModulePage>
      <ModuleToast message={message} />
    </CatalogShell>
  );
}
