import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import Button from '../components/ui/Button';
import { ErrorState } from '../components/ui/Feedback';
import { buscarUsuarioAtual, obterToken } from '../services/authService';
import {
  serviceDetail,
  favoriteStatus,
  updateFavorite,
  defaultServiceImage,
  defaultProfileImage,
  formatCurrency,
  serviceDate,
  serviceSummary
} from '../services/catalogService';

const surface =
  'border border-[rgba(226,232,240,0.9)] bg-white/94 shadow-[0_18px_48px_rgba(15,23,42,0.09)] dark:border-[rgba(148,163,184,0.16)] dark:bg-[rgba(18,26,42,0.94)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.32)]';
const action =
  'inline-flex min-h-12 w-full items-center justify-center gap-[9px] rounded-[14px] text-[0.9rem] font-[850] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-[0.72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-workly-primary';
function fallbackImage(event, fallback) {
  if (event.currentTarget.src !== new URL(fallback, location.origin).href)
    event.currentTarget.src = fallback;
}
function Description({ title, kicker, children }) {
  return (
    <article className={`${surface} rounded-[22px] p-[26px] legacy-max-780:p-5`}>
      <div className="mb-4">
        <span className="mb-2 inline-flex text-xs font-black text-[#039848] uppercase">
          {kicker}
        </span>
        <h2 className="text-[1.28rem] leading-[1.2] font-[850] text-[#0f172a] dark:text-workly-dark-text">
          {title}
        </h2>
      </div>
      <p className="text-[0.98rem] leading-[1.82] break-words whitespace-pre-line text-[#475569] dark:text-workly-dark-text">
        {children}
      </p>
    </article>
  );
}

export default function ServiceDetailPage() {
  const [params] = useSearchParams(),
    id = params.get('id'),
    navigate = useNavigate();
  const [data, setData] = useState(null),
    [user, setUser] = useState(null),
    [error, setError] = useState(null);
  const [saved, setSaved] = useState(false),
    [saving, setSaving] = useState(false),
    [toast, setToast] = useState(null);
  const toastTimer = useRef(null),
    redirectTimer = useRef(null);
  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(redirectTimer.current);
    },
    []
  );
  function notify(title, message, type = 'success') {
    clearTimeout(toastTimer.current);
    setToast({ title, message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    setData(null);
    setError(null);
    setSaved(false);
    if (!id) {
      setError({
        title: 'Serviço não informado',
        message: 'Não encontramos o identificador do serviço na URL.'
      });
      return () => {
        mounted = false;
      };
    }
    (async () => {
      const currentUser = await buscarUsuarioAtual(true);
      if (!mounted) return;
      setUser(currentUser);
      try {
        const result = await serviceDetail(id, { signal: controller.signal });
        if (!mounted) return;
        setData(result);
        if (obterToken()) {
          try {
            const value = await favoriteStatus(result.service.idServico || id);
            if (mounted) setSaved(value);
          } catch {
            if (mounted) setSaved(false);
          }
        }
      } catch (err) {
        if (mounted && err.name !== 'AbortError')
          setError({
            title: 'Serviço não encontrado',
            message: err.message || 'Não foi possível carregar este serviço.'
          });
      }
    })();
    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(redirectTimer.current);
    };
  }, [id]);
  const service = data?.service || {},
    raw = data?.raw || {};
  const name = data ? service.nome || 'Serviço sem título' : 'Carregando serviço...';
  const category = data ? service.nomeCategoria || 'Categoria não informada' : 'Carregando...';
  const seller = data ? service.nomeFreelancer || 'Freelancer Workly' : 'Carregando freelancer...';
  const description = data
    ? raw.descricao ||
      service.descricao ||
      'O freelancer ainda não adicionou uma descrição para este serviço.'
    : 'Carregando descrição...';
  const owner = Boolean(user && String(user.idUsuario) === String(service.idUsuario));
  const proposal = Boolean(raw.valorCombinar || service.valorCombinar);
  const freelancerMedia =
    Number(
      raw.avaliacaoMediaFreelancer ??
        raw.avaliacao_media_freelancer ??
        service.avaliacaoMediaFreelancer ??
        0
    ) || 0;
  const freelancerTotal =
    Number(
      raw.totalAvaliacoesFreelancer ??
        raw.total_avaliacoes_freelancer ??
        service.totalAvaliacoesFreelancer ??
        0
    ) || 0;
  function needLogin(message) {
    notify('Login necessário', message, 'info');
    redirectTimer.current = setTimeout(() => navigate('/login'), 900);
  }
  function purchase() {
    if (!data) return;
    if (!user) return needLogin('Entre na sua conta para continuar.');
    if (owner)
      return notify('Este serviço é seu', 'Use o perfil para gerenciar o anúncio.', 'info');
    navigate(
      `/${proposal ? 'negociar-servico' : 'contratar-servico'}?id=${encodeURIComponent(service.idServico || id)}`
    );
  }
  async function favorite() {
    if (!data) return;
    if (!obterToken()) return needLogin('Entre para salvar favoritos.');
    const previous = saved;
    setSaving(true);
    try {
      await updateFavorite(service.idServico || id, previous);
      try {
        setSaved(await favoriteStatus(service.idServico || id));
      } catch {
        setSaved(false);
      }
      notify(
        previous ? 'Removido dos favoritos' : 'Serviço salvo',
        previous ? 'Removido com sucesso.' : 'Acesse pela página Favoritos.',
        previous ? 'info' : 'success'
      );
    } catch (err) {
      notify('Erro nos favoritos', err.message || 'Não foi possível atualizar.', 'info');
    } finally {
      setSaving(false);
    }
  }
  async function copy() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(location.href);
      notify('Link copiado', 'Link copiado para a área de transferência.');
    } catch {
      notify('Não foi possível copiar', 'Copie pela barra do navegador.', 'info');
    }
  }
  const shell = 'mx-auto w-[min(1120px,calc(100%-48px))] legacy-max-780:w-[calc(100%-28px)]';
  return (
    <CatalogShell title={data ? `Workly - ${name}` : 'Workly - Detalhes do Serviço'}>
      <main
        aria-live="polite"
        className="min-h-[calc(100vh-340px)] bg-[radial-gradient(circle_at_top_left,rgba(4,191,85,0.12),transparent_360px),linear-gradient(180deg,#ffffff_0%,#f6f8fb_260px)] dark:bg-[radial-gradient(circle_at_top_left,rgba(4,191,85,0.13),transparent_360px),linear-gradient(180deg,#0b1220_0%,#0e1726_260px)]"
      >
        {error ? (
          <div className={shell}>
            <ErrorState
              className={`${surface} mx-auto my-[60px] max-w-[560px] rounded-[22px] p-[34px] text-center`}
            >
              <i
                aria-hidden="true"
                className="fas fa-circle-exclamation mb-[14px] text-[2.4rem] text-workly-primary"
              />
              <h1 className="mb-2 text-[1.8rem] font-bold text-[#0f172a] dark:text-[#4ade80]">
                {error.title}
              </h1>
              <p className="mb-[22px] leading-[1.6] text-[#64748b] dark:text-workly-dark-text">
                {error.message}
              </p>
              <Link
                to="/todos-servicos"
                className={`${action} w-auto bg-[linear-gradient(135deg,#04bf55,#07d464)] px-[26px] text-white shadow-[0_14px_26px_rgba(4,191,85,0.24)]`}
              >
                Ver outros serviços
              </Link>
            </ErrorState>
          </div>
        ) : (
          <section className="pt-[26px] pb-6 legacy-max-780:pt-[18px]">
            <div className={shell}>
              <nav
                aria-label="Navegação"
                className="mb-6 flex w-fit max-w-full items-center gap-2.5 overflow-x-auto rounded-full border border-[rgba(226,232,240,0.88)] bg-white/82 px-[13px] py-[9px] text-[0.86rem] leading-none font-bold whitespace-nowrap text-[#64748b] shadow-[0_10px_28px_rgba(15,23,42,0.06)] legacy-max-780:w-full dark:border-[rgba(148,163,184,0.16)] dark:bg-[rgba(18,26,42,0.94)] dark:text-[#94a3b8]"
              >
                <Link to="/">Início</Link>
                <i
                  aria-hidden="true"
                  className="fas fa-chevron-right text-[0.68rem] opacity-[0.62]"
                />
                <Link to="/todos-servicos">Serviços</Link>
                <i
                  aria-hidden="true"
                  className="fas fa-chevron-right text-[0.68rem] opacity-[0.62]"
                />
                {service.categoriaId ? (
                  <Link
                    className="text-[#039848]"
                    to={`/categorias?id=${encodeURIComponent(service.categoriaId)}`}
                  >
                    {category}
                  </Link>
                ) : (
                  <span>{category}</span>
                )}
              </nav>
              <div className="mb-[22px] grid grid-cols-[minmax(0,1fr)_auto] items-end gap-[22px] legacy-max-780:grid-cols-1 legacy-max-780:items-start">
                <div className="min-w-0">
                  <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-workly-primary/12 px-3 py-2 text-[0.82rem] font-extrabold text-[#039848]">
                    <i aria-hidden="true" className="fas fa-briefcase" />
                    Detalhes do serviço
                  </span>
                  <h1 className="max-w-[850px] text-[3.55rem] leading-none font-bold break-words text-[#0f172a] legacy-max-780:text-[2.85rem] legacy-max-440:text-[39px] legacy-max-360:text-[32px] dark:text-[#4ade80]">
                    {name}
                  </h1>
                  <p className="mt-[14px] max-w-[760px] leading-[1.7] text-[#64748b] dark:text-[#cbd5e1]">
                    {data
                      ? serviceSummary(description, seller, category)
                      : 'Carregando informações principais do serviço.'}
                  </p>
                </div>
                <Link
                  to="/todos-servicos"
                  className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border border-[rgba(148,163,184,0.22)] bg-white/78 px-4 text-[0.9rem] font-extrabold text-[#475569] hover:-translate-y-px hover:text-[#039848] dark:bg-[rgba(18,26,42,0.94)] dark:text-[#94a3b8]"
                >
                  <i aria-hidden="true" className="fas fa-arrow-left" />
                  Ver outros serviços
                </Link>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6 legacy-max-1120:grid-cols-1">
                <div className="grid min-w-0 content-start gap-[18px]">
                  <section
                    aria-label="Imagem do serviço"
                    className={`${surface} relative w-full aspect-video min-h-[390px] min-w-0 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#102031,#0c3b2b)] legacy-max-780:aspect-[4/3] legacy-max-780:min-h-60 legacy-max-780:rounded-[22px]`}
                  >
                    <img
                      src={service.imagemServico || defaultServiceImage}
                      alt={data ? `Imagem do serviço ${name}` : 'Imagem do serviço'}
                      loading="eager"
                      onError={(event) => fallbackImage(event, defaultServiceImage)}
                      className="block h-full min-h-[inherit] w-full bg-[#0f172a] object-cover"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_62%,rgba(15,23,42,0.16))]"
                    />
                  </section>
                  <div
                    aria-label="Resumo do serviço"
                    className="grid grid-cols-3 gap-3 legacy-max-780:grid-cols-1"
                  >
                    {[
                      ['fa-layer-group', 'Categoria', data ? category : '--'],
                      [
                        'fa-calendar-plus',
                        'Publicado em',
                        data ? serviceDate(service, 'Recentemente') : '--'
                      ],
                      ['fa-user-check', 'Freelancer', data ? seller : '--']
                    ].map(([icon, label, value]) => (
                      <div
                        key={label}
                        className={`${surface} flex min-w-0 items-center gap-[13px] rounded-[18px] p-[15px]`}
                      >
                        <i
                          aria-hidden="true"
                          className={`fas ${icon} inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-workly-primary/12 text-workly-primary`}
                        />
                        <div className="min-w-0">
                          <span className="block text-[0.76rem] font-extrabold text-[#64748b] dark:text-[#94a3b8]">
                            {label}
                          </span>
                          <strong className="mt-[3px] block max-w-[170px] truncate text-[0.95rem] font-[850] text-[#0f172a] dark:text-[#f8fafc]">
                            {value}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Description title="O que está incluído" kicker="Descrição">
                    {description}
                  </Description>
                  {(raw.extra || service.extra) && (
                    <Description title="Informações adicionais" kicker="Detalhes">
                      {raw.extra || service.extra}
                    </Description>
                  )}
                </div>
                <aside
                  aria-label="Ações do serviço"
                  className={`${surface} sticky top-[92px] rounded-3xl p-5 legacy-max-1120:static legacy-max-1120:max-w-[520px]`}
                >
                  <div className="flex items-center gap-[13px] rounded-[18px] border border-workly-primary/[0.16] bg-[linear-gradient(135deg,rgba(4,191,85,0.1),rgba(255,255,255,0.72))] p-3 legacy-max-440:items-start dark:border-[rgba(134,239,172,0.16)] dark:bg-[linear-gradient(135deg,rgba(4,191,85,0.13),rgba(18,26,42,0.72))]">
                    <img
                      src={service.fotoPerfil || defaultProfileImage}
                      alt="Foto do freelancer"
                      onError={(event) => fallbackImage(event, defaultProfileImage)}
                      className="h-[54px] w-[54px] shrink-0 rounded-full border-[3px] border-white bg-[#e2e8f0] object-cover shadow-[0_10px_22px_rgba(15,23,42,0.12)] dark:border-white/12"
                    />
                    <div className="flex min-w-0 flex-col gap-[3px]">
                      <span className="truncate text-[0.98rem] leading-[1.2] font-[850] text-[#0f172a] legacy-max-440:whitespace-normal dark:text-[#f8fafc]">
                        {seller}
                      </span>
                      <span className="truncate text-[0.82rem] leading-[1.35] text-[#64748b] legacy-max-440:whitespace-normal dark:text-[#94a3b8]">
                        {data ? category : 'Profissional da Workly'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-extrabold text-[#0f8f45]">
                        <i
                          aria-hidden="true"
                          className="fas fa-star text-[0.72rem] text-[#f59e0b]"
                        />
                        {freelancerMedia && freelancerTotal
                          ? `${freelancerMedia.toFixed(1).replace('.', ',')} • ${freelancerTotal} avaliações`
                          : 'Sem avaliações ainda'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-[18px] pb-4">
                    <span className="mb-[7px] block text-[0.8rem] font-extrabold text-[#64748b] uppercase dark:text-[#94a3b8]">
                      Valor do serviço
                    </span>
                    <strong className="block text-[2.45rem] leading-none font-black text-[#0f172a] legacy-max-440:text-[1.82rem] dark:text-[#4ade80]">
                      {proposal
                        ? 'Valor a combinar'
                        : formatCurrency(raw.preco ?? service.preco ?? 0)}
                    </strong>
                    <p className="mt-2.5 text-[0.88rem] leading-[1.55] text-[#64748b] dark:text-[#cbd5e1]">
                      {proposal
                        ? 'Envie uma proposta para combinar escopo, prazo e valor.'
                        : 'Confirme o escopo antes de finalizar a contratação.'}
                    </p>
                  </div>
                  <div className="grid gap-2.5">
                    <Button
                      appearance="custom"
                      onClick={purchase}
                      className={`${action} border-0 bg-[linear-gradient(135deg,#04bf55,#07d464)] text-white shadow-[0_14px_26px_rgba(4,191,85,0.24)]`}
                    >
                      <i
                        aria-hidden="true"
                        className={`fas ${proposal ? 'fa-paper-plane' : 'fa-shopping-cart'}`}
                      />
                      {proposal ? 'Enviar proposta' : 'Continuar contratação'}
                    </Button>
                    <Button
                      appearance="custom"
                      onClick={favorite}
                      disabled={saving}
                      className={`${action} border ${saved ? 'border-transparent bg-[linear-gradient(135deg,#e11d48,#fb7185)] text-white' : 'border-[rgba(225,29,72,0.14)] bg-[#fff1f2] text-[#e11d48] dark:border-[rgba(251,113,133,0.14)] dark:bg-[rgba(225,29,72,0.12)] dark:text-[#fb7185]'}`}
                    >
                      <i aria-hidden="true" className={`${saved ? 'fas' : 'far'} fa-heart`} />
                      <span>{saved ? 'Salvo nos favoritos' : 'Salvar nos favoritos'}</span>
                    </Button>
                    <Button
                      appearance="custom"
                      onClick={copy}
                      className={`${action} border border-[rgba(148,163,184,0.22)] bg-white text-[#0f172a] dark:border-[rgba(148,163,184,0.16)] dark:bg-[#182235] dark:text-[#f8fafc]`}
                    >
                      <i aria-hidden="true" className="fas fa-link" />
                      Copiar link
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-2.5 border-t border-[rgba(148,163,184,0.22)] pt-4">
                    {[
                      ['fa-shield-alt', 'Use a página de contratação para registrar o pedido.'],
                      ['fa-comments', 'Combine prazo, escopo e revisões antes do início.']
                    ].map(([icon, text]) => (
                      <div
                        key={icon}
                        className="grid grid-cols-[22px_minmax(0,1fr)] gap-2.5 text-[0.84rem] leading-[1.45] text-[#64748b] dark:text-[#cbd5e1]"
                      >
                        <i aria-hidden="true" className={`fas ${icon} text-workly-primary`} />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-[14px]">
                    {owner && (
                      <Link
                        to={`/editar-servico?id=${service.idServico || id}`}
                        className={`${action} border border-workly-primary/[0.26] bg-workly-primary/12 text-[#047a39] dark:bg-workly-primary/[0.18] dark:text-[#86efac]`}
                      >
                        <i aria-hidden="true" className="fas fa-pen" />
                        Editar serviço
                      </Link>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          </section>
        )}
        {toast && (
          <div
            role="status"
            className="pointer-events-none fixed right-6 bottom-6 z-[12000] flex w-[min(360px,calc(100%-32px))] items-center gap-[14px] rounded-[20px] border border-[rgba(226,232,240,0.9)] bg-white/96 px-[18px] py-4 text-[#0f172a] shadow-[0_22px_60px_rgba(15,23,42,0.18)] dark:bg-[rgba(18,26,42,0.98)] dark:text-[#f8fafc]"
          >
            <i
              aria-hidden="true"
              className={`fas ${toast.type === 'success' ? 'fa-check' : 'fa-info'} grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] bg-workly-primary/12 text-workly-primary`}
            />
            <div>
              <strong className="block text-[0.96rem] font-[850]">{toast.title}</strong>
              <span className="mt-0.5 block text-[0.84rem] leading-[1.45] text-[#64748b] dark:text-[#94a3b8]">
                {toast.message}
              </span>
            </div>
          </div>
        )}
      </main>
    </CatalogShell>
  );
}
