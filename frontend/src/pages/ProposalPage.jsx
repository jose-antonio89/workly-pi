import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import { LoadingState } from '../components/ui/Feedback';
import { ModuleButton, ModuleToast, useModuleToast } from '../components/ui/ModuleUI';
import { buscarUsuarioAtual } from '../services/authService';
import { createContract } from '../services/contractService';
import {
  defaultServiceImage,
  defaultProfileImage,
  formatCurrency,
  serviceDetail
} from '../services/catalogService';

const card =
  'workly-proposal-card rounded-[28px] border border-[#94a3b8]/18 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-[#94a3b8]/16 dark:bg-[#101b2d] dark:shadow-[0_18px_50px_rgba(0,0,0,0.35)]';
const kicker =
  'inline-flex items-center gap-2 rounded-full bg-workly-primary/12 px-3.5 py-2 text-[0.9rem] font-extrabold text-[#029d47]';
const input =
  'min-w-0 rounded-2xl border border-[#dbe4ef] bg-white outline-none focus-within:border-workly-primary focus-within:shadow-[0_0_0_4px_rgba(4,191,85,0.12)] dark:border-[#94a3b8]/20 dark:bg-[#0b1424] dark:text-[#f8fafc]';
export default function ProposalPage() {
  const [params] = useSearchParams(),
    id = params.get('id'),
    navigate = useNavigate(),
    timer = useRef(null),
    [service, setService] = useState(null),
    [count, setCount] = useState(0),
    [busy, setBusy] = useState(false),
    [message, toast] = useModuleToast(2600);
  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) {
        navigate('/todos-servicos', { replace: true });
        return;
      }
      try {
        const user = await buscarUsuarioAtual(true).catch(() => null);
        const result = await serviceDetail(id);
        if (!active) return;
        if (user && String(user.idUsuario) === String(result.service.idUsuario)) {
          toast('Você não pode contratar o próprio serviço.');
          timer.current = setTimeout(() => navigate('/perfil'), 900);
          return;
        }
        setService(result.service);
      } catch (error) {
        if (active) {
          toast(error.message || 'Erro ao carregar serviço.');
          timer.current = setTimeout(() => navigate('/todos-servicos'), 1100);
        }
      }
    })();
    return () => {
      active = false;
      clearTimeout(timer.current);
    };
  }, [id, navigate]);
  async function submit(event) {
    event.preventDefault();
    if (!service) return;
    const fd = new FormData(event.currentTarget),
      mensagem = String(fd.get('mensagem') || '').trim();
    if (!mensagem) {
      toast('Escreva uma mensagem para o freelancer.');
      return;
    }
    setBusy(true);
    try {
      await createContract({ servicoId: id, precoProposto: fd.get('precoProposto'), mensagem });
      toast('Proposta enviada com sucesso!');
      timer.current = setTimeout(() => navigate('/contratos'), 900);
    } catch (error) {
      toast(error.message || 'Não foi possível enviar a proposta.');
      setBusy(false);
    }
  }
  return (
    <CatalogShell title="Negociar Serviço" footer="empty">
      <main className="min-h-[72vh] bg-[#f5f8fb] bg-[radial-gradient(circle_at_top_left,rgba(4,191,85,.14),transparent_34%)] px-5 pt-[42px] pb-[70px] text-[#0f172a] dark:bg-[#07111f] dark:bg-[radial-gradient(circle_at_top_left,rgba(4,191,85,.13),transparent_34%)] dark:text-[#eef4ff]">
        <section className="mx-auto max-w-[1120px]">
          <Link
            to={`/detalhe-servico?id=${encodeURIComponent(id || '')}`}
            className="mb-[18px] inline-flex items-center gap-2 font-bold text-[#64748b] focus-visible:outline-2 focus-visible:outline-workly-primary dark:text-[#cbd5e1]"
          >
            <i aria-hidden="true" className="fas fa-arrow-left" />
            Voltar ao serviço
          </Link>
          <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(360px,0.78fr)] gap-6 items-start legacy-max-900:grid-cols-1">
            <aside className={card}>
              <img
                id="service-image"
                src={service?.imagemServico || defaultServiceImage}
                alt="Imagem do serviço"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = defaultServiceImage;
                }}
                className="mb-[18px] h-[285px] w-full rounded-[22px] object-cover legacy-max-900:h-[230px]"
              />
              <span className={kicker}>
                <i aria-hidden="true" className="fas fa-layer-group" />
                {service?.nomeCategoria || 'Carregando'}
              </span>
              <h1
                id="service-title"
                style={{ fontWeight: 700 }}
                className="mt-3 mb-3 text-[3.4rem] leading-[0.98] legacy-max-760:text-[2rem]"
              >
                {service?.nome || 'Carregando serviço...'}
              </h1>
              <p
                id="service-description"
                className="leading-[1.65] text-[#64748b] dark:text-[#cbd5e1]"
              >
                {service
                  ? service.descricao || 'Sem descrição.'
                  : 'Buscando informações do serviço.'}
              </p>
              <div className="mt-[18px] flex items-center gap-3 rounded-[18px] bg-[#f8fafc] p-3 dark:bg-[#0b1424]">
                <img
                  src={service?.fotoPerfil || defaultProfileImage}
                  alt="Foto do freelancer"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = defaultProfileImage;
                  }}
                  className="h-[52px] w-[52px] rounded-full object-cover"
                />
                <div>
                  <strong className="block">{service?.nomeFreelancer || 'Freelancer'}</strong>
                  <span className="block text-[#64748b] dark:text-[#cbd5e1]">
                    {!service || service.valorCombinar
                      ? 'Valor a combinar'
                      : `Base: ${formatCurrency(service.preco || 0)}`}
                  </span>
                </div>
              </div>
            </aside>
            <section className={card}>
              <span className={kicker}>
                <i aria-hidden="true" className="fas fa-handshake" />
                Proposta de contratação
              </span>
              <h2 id="proposal-title" className="my-2 text-[2rem] leading-[1.40625] font-bold">
                {service?.valorCombinar ? 'Combinar valor do serviço' : 'Enviar proposta'}
              </h2>
              <p className="leading-[1.65] text-[#64748b] dark:text-[#cbd5e1]">
                {service?.valorCombinar
                  ? 'Este serviço não tem preço fechado. Envie sua necessidade para o freelancer montar uma proposta.'
                  : 'Informe sua mensagem e, se necessário, um valor para o freelancer avaliar.'}
              </p>
              <form id="proposal-form" onSubmit={submit} className="mt-5 grid gap-[18px]">
                <div>
                  <label htmlFor="precoProposto" className="mb-2 block font-extrabold">
                    Valor proposto
                  </label>
                  <div className={`${input} flex h-[58px] items-center gap-2.5 px-4`}>
                    <span>R$</span>
                    <input
                      id="precoProposto"
                      name="precoProposto"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Ex.: 150,00"
                      className="h-full min-w-0 flex-1 bg-transparent outline-none"
                    />
                  </div>
                  <small className="mt-2 block font-semibold text-[#718096] dark:text-[#cbd5e1]">
                    {service?.valorCombinar
                      ? 'Opcional: informe um valor se quiser sugerir um orçamento inicial.'
                      : 'Como o serviço aceita negociação, você pode sugerir um valor.'}
                  </small>
                </div>
                <div>
                  <label htmlFor="mensagem" className="mb-2 block font-extrabold">
                    Mensagem para o freelancer
                  </label>
                  <textarea
                    id="mensagem"
                    name="mensagem"
                    rows="7"
                    maxLength="600"
                    required
                    placeholder="Explique o que você precisa, prazo desejado, referências e detalhes importantes."
                    onChange={(event) => setCount(event.target.value.length)}
                    className={`${input} block w-full resize-y rounded-[18px] p-4`}
                  />
                  <small className="mt-2 block font-semibold text-[#718096] dark:text-[#cbd5e1]">
                    <span id="char-count">{count}</span>/600 caracteres
                  </small>
                </div>
                <ModuleButton
                  style={{ fontSize: '1rem' }}
                  type="submit"
                  disabled={busy}
                  className="min-h-14"
                >
                  <i
                    aria-hidden="true"
                    className={busy ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'}
                  />
                  {busy ? <LoadingState inline message="Enviando..." /> : 'Enviar proposta'}
                </ModuleButton>
                <p className="flex gap-2 text-[0.92rem] leading-[1.65] text-[#64748b] dark:text-[#cbd5e1]">
                  <i aria-hidden="true" className="fas fa-circle-info" />A proposta aparecerá em
                  Contratos como pendente para acompanhamento.
                </p>
              </form>
            </section>
          </div>
        </section>
      </main>
      <ModuleToast message={message} />
    </CatalogShell>
  );
}
