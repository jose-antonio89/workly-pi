import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import Button from '../components/ui/Button';
import { LoadingState } from '../components/ui/Feedback';
import { showAuthAlert } from '../components/auth/authPresentation';
import { createContract } from '../services/contractService';
import {
  defaultServiceImage,
  formatCurrency,
  serviceDetail,
  serviceRating
} from '../services/catalogService';

const surface =
  'rounded-[28px] dark:bg-transparent border border-[#94a3b8]/18 bg-white/86 shadow-[0_22px_58px_rgba(15,23,42,0.08)] backdrop-blur-[16px] legacy-max-680:rounded-[24px] dark:border-[#5e82ac]/18 dark:bg-[linear-gradient(160deg,rgba(14,25,42,0.94),rgba(12,20,36,0.90))]';
const field = 'mb-[18px]',
  label = 'mb-[9px] block font-black text-[#0f172a] dark:text-[#eef4ff]';
const input =
  'min-w-0 border border-[#dbe5f0] bg-white text-[#0f172a] outline-none focus-within:border-workly-primary/52 focus-within:shadow-[0_0_0_4px_rgba(4,191,85,0.12)] dark:border-[#5e82ac]/22 dark:bg-[#0a1222]/92 dark:text-[#eef4ff]';
const badge =
  'inline-flex items-center gap-2 rounded-full bg-workly-primary/10 px-[13px] py-2 text-[0.76rem] font-black text-[#039447] uppercase dark:text-[#86efac]';
export default function HirePage() {
  const [params] = useSearchParams(),
    id = params.get('id'),
    navigate = useNavigate(),
    details = useRef(null),
    [service, setService] = useState(null),
    [length, setLength] = useState(0),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) {
        await showAuthAlert({
          icon: 'error',
          title: 'Serviço não informado',
          text: 'Volte para a página do serviço e tente novamente.'
        });
        if (active) navigate('/todos-servicos', { replace: true });
        return;
      }
      try {
        const result = await serviceDetail(id);
        if (active) setService(result.service);
      } catch (error) {
        if (!active) return;
        await showAuthAlert({
          icon: 'error',
          title: 'Erro ao carregar',
          text: error.message || 'Não foi possível carregar o serviço.'
        });
        if (active) navigate('/todos-servicos', { replace: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [id, navigate]);
  const cancel = () =>
    history.length > 1 ? navigate(-1) : navigate(`/detalhe-servico?id=${encodeURIComponent(id)}`);
  async function submit(event) {
    event.preventDefault();
    if (!service) return;
    const fd = new FormData(event.currentTarget),
      detalhesPedido = String(fd.get('detalhesPedido') || '').trim();
    if (detalhesPedido.length < 20) {
      await showAuthAlert({
        icon: 'warning',
        title: 'Detalhe um pouco mais',
        text: 'Escreva pelo menos 20 caracteres para o freelancer entender melhor o pedido.'
      });
      details.current?.focus();
      return;
    }
    setBusy(true);
    try {
      await createContract({
        servicoId: id,
        detalhesPedido,
        prazoDesejado: String(fd.get('prazoDesejado') || '').trim(),
        referencias: String(fd.get('referencias') || '').trim()
      });
      await showAuthAlert({
        icon: 'success',
        title: 'Contratação concluída!',
        text: 'Agora acompanhe o andamento na página de contratos.',
        confirmText: 'Ver contratos'
      });
      navigate('/contratos');
    } catch (error) {
      await showAuthAlert({
        icon: 'error',
        title: 'Erro ao contratar',
        text: error.message || 'Não foi possível concluir a contratação.'
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <CatalogShell title="Detalhes da contratação" footer={false}>
      <main className="min-h-[78vh] bg-[linear-gradient(135deg,#f6f9fc,#edf3fa)] px-5 pb-[72px] text-[#0f172a] legacy-max-680:px-3.5 legacy-max-680:pb-14 dark:bg-[linear-gradient(135deg,#07111f,#0d1a2b)] dark:text-[#eef4ff]">
        <section className="mx-auto grid max-w-[1120px] grid-cols-[minmax(0,1fr)_auto] items-end gap-7 pt-[42px] pb-6 legacy-max-980:grid-cols-1 legacy-max-680:pt-[30px]">
          <div>
            <Button
              appearance="custom"
              onClick={() => navigate(-1)}
              className="mb-[18px] inline-flex items-center gap-[9px] font-extrabold text-[#64748b] focus-visible:outline-2 focus-visible:outline-workly-primary dark:text-[#a9b9cf]"
            >
              <i aria-hidden="true" className="fas fa-arrow-left" />
              Voltar ao serviço
            </Button>
            <span className={badge}>
              <i aria-hidden="true" className="fas fa-shield-alt" />
              Contratação segura
            </span>
            <h1
              style={{ fontWeight: 700 }}
              className="mt-3.5 mb-2.5 max-w-[680px] text-[4.35rem] leading-[0.94] legacy-max-784:text-[2.45rem]"
            >
              Finalize o pedido
            </h1>
            <p className="max-w-[620px] text-[1.05rem] leading-[1.65] font-semibold text-[#5f718a] dark:text-[#a9b9cf]">
              Conte o essencial para o freelancer entender o objetivo, o prazo e as referências
              antes de começar.
            </p>
          </div>
          <div
            aria-label="Etapas da contratação"
            className="flex max-w-full gap-2.5 overflow-x-auto rounded-full border border-[#94a3b8]/18 bg-white/72 p-2.5 shadow-[0_16px_36px_rgba(15,23,42,0.07)] dark:bg-[#0a1222]"
          >
            {['Detalhes', 'Contrato', 'Entrega'].map((text, index) => (
              <div
                key={text}
                className={`flex min-h-11 shrink-0 items-center gap-[9px] rounded-full py-1.5 pr-[13px] pl-[7px] font-extrabold ${index === 0 ? 'bg-workly-primary/10 text-[#052e16] dark:text-[#86efac]' : 'text-[#64748b] dark:text-[#a9b9cf]'}`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-[0.88rem] ${index === 0 ? 'bg-[linear-gradient(135deg,#0fce6a,#04bf55)] text-white' : 'bg-[#edf3f8] dark:bg-[#17233a]'}`}
                >
                  {index + 1}
                </span>
                <strong className="text-[0.9rem]">{text}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto grid max-w-[1120px] grid-cols-[minmax(0,1fr)_minmax(310px,360px)] items-start gap-[22px] legacy-max-980:grid-cols-1">
          <form
            id="hireDetailsForm"
            onSubmit={submit}
            className={`${surface} p-7 legacy-max-680:p-[22px]`}
          >
            <div className="mb-6 flex items-start gap-[15px]">
              <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[18px] bg-[linear-gradient(135deg,#86efac,#22c55e)] text-[#052e16] shadow-[0_14px_30px_rgba(34,197,94,0.22)]">
                <i aria-hidden="true" className="fas fa-clipboard-list" />
              </span>
              <div>
                <h2 className="mb-1.5 text-[1.65rem] leading-[1.2] font-extrabold">
                  Detalhes do serviço
                </h2>
                <p className="leading-[1.55] font-semibold text-[#5f718a] dark:text-[#a9b9cf]">
                  Preencha só o necessário. Depois disso, o pedido aparece em contratos.
                </p>
              </div>
            </div>
            <div className={field}>
              <label className={label} htmlFor="detalhesPedido">
                O que você precisa? <span className="text-workly-primary">*</span>
              </label>
              <textarea
                ref={details}
                id="detalhesPedido"
                name="detalhesPedido"
                rows="7"
                minLength="20"
                maxLength="900"
                required
                onChange={(event) => setLength(event.target.value.length)}
                placeholder="Ex: Preciso de uma landing page para divulgar meu serviço. Quero uma página moderna, com seção de benefícios, depoimentos e botão para WhatsApp. O público é de pequenos empreendedores."
                className={`${input} block min-h-[198px] w-full resize-y rounded-[18px] p-[18px] leading-[1.62]`}
              />
              <div className="mt-[9px] flex justify-between gap-3.5 text-[0.86rem] font-bold text-[#718096] legacy-max-680:flex-col legacy-max-680:gap-1 dark:text-[#a9b9cf]">
                <small className="text-inherit">
                  Fale sobre objetivo, público, estilo, conteúdo e restrições.
                </small>
                <span id="detailsCounter" className="text-[#039447] dark:text-[#86efac]">
                  {length}/900
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 legacy-max-680:grid-cols-1">
              <div className={field}>
                <label className={label} htmlFor="prazoDesejado">
                  Prazo desejado
                </label>
                <div className={`${input} flex h-14 items-center gap-3 rounded-[18px] px-4`}>
                  <i aria-hidden="true" className="far fa-calendar-alt text-workly-primary" />
                  <select
                    id="prazoDesejado"
                    name="prazoDesejado"
                    className="h-full min-w-0 flex-1 bg-transparent font-bold outline-none"
                  >
                    <option value="">Sem prazo definido</option>
                    {[
                      'Urgente: 2 a 3 dias',
                      'Até 7 dias',
                      'Até 15 dias',
                      'Sem pressa',
                      'A combinar com o freelancer'
                    ].map((value) => (
                      <option key={value} value={value}>
                        {value === 'Urgente: 2 a 3 dias' ? 'Urgente — 2 a 3 dias' : value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={field}>
                <label className={label} htmlFor="referencias">
                  Referências ou links
                </label>
                <div className={`${input} flex h-14 items-center gap-3 rounded-[18px] px-4`}>
                  <i aria-hidden="true" className="fas fa-link text-workly-primary" />
                  <input
                    id="referencias"
                    name="referencias"
                    maxLength="240"
                    placeholder="Link, estilo ou exemplo opcional"
                    className="h-full min-w-0 flex-1 bg-transparent font-bold outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-0.5 mb-6 grid grid-cols-3 gap-2.5 legacy-max-680:grid-cols-1">
              {[
                ['fa-bullseye', 'Objetivo claro'],
                ['fa-clock', 'Prazo realista'],
                ['fa-paperclip', 'Referências ajudam']
              ].map(([icon, text]) => (
                <div
                  key={text}
                  className="flex min-h-12 items-center gap-2 rounded-2xl bg-[#f3f7fb] px-[13px] text-[0.88rem] font-[850] dark:bg-[#17233a]"
                >
                  <i aria-hidden="true" className={`fas ${icon} text-workly-primary`} />
                  {text}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-1 legacy-max-680:flex-col-reverse">
              <Button
                appearance="custom"
                type="button"
                onClick={cancel}
                className="min-h-[52px] rounded-2xl bg-[#edf3f8] px-[21px] font-black focus-visible:outline-2 focus-visible:outline-workly-primary dark:bg-white/14"
              >
                Cancelar
              </Button>
              <Button
                appearance="custom"
                type="submit"
                disabled={busy}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0fce6a,#04bf55)] px-[21px] font-black text-white shadow-[0_16px_34px_rgba(4,191,85,0.24)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-workly-primary disabled:opacity-60"
              >
                <i
                  aria-hidden="true"
                  className={busy ? 'fas fa-spinner fa-spin' : 'fas fa-check'}
                />
                {busy ? (
                  <LoadingState inline message="Criando contrato..." />
                ) : (
                  'Concluir contratação'
                )}
              </Button>
            </div>
          </form>
          <aside
            aria-label="Resumo da contratação"
            className="sticky top-24 grid gap-3.5 legacy-max-980:static"
          >
            <div className={`${surface} p-5`}>
              <div className={badge}>Resumo do serviço</div>
              <div
                id="servicePreview"
                className="mt-3.5 mb-[18px] rounded-[20px] bg-[#0f172a]/4 p-4 dark:bg-[#94a3b8]/10"
              >
                {service ? (
                  <div className="grid gap-1">
                    <div className="grid grid-cols-[68px_minmax(0,1fr)] items-center gap-1 legacy-max-680:grid-cols-[58px_minmax(0,1fr)]">
                      <img
                        src={service.imagemServico}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = defaultServiceImage;
                        }}
                        className="h-[68px] w-[68px] rounded-[18px] object-cover legacy-max-680:h-[58px] legacy-max-680:w-[58px]"
                      />
                      <div>
                        <span className="mb-[7px] inline-block rounded-full bg-workly-primary/10 px-[9px] py-[5px] text-[0.68rem] font-black text-[#64748b] uppercase dark:text-[#9fb0c7]">
                          {service.nomeCategoria || 'Serviço'}
                        </span>
                        <h3 className="line-clamp-2 leading-[1.22] font-extrabold">
                          {service.nome}
                        </h3>
                      </div>
                    </div>
                    <p className="line-clamp-2 border-t border-[#94a3b8]/18 pt-3 text-[0.9rem] leading-[1.5] font-[650] text-[#526174] dark:text-[#a9b9cf]">
                      {service.descricao ||
                        service.descricaoServico ||
                        'O freelancer receberá os detalhes informados nesta etapa para iniciar o trabalho com mais clareza.'}
                    </p>
                    <div className="grid gap-1 text-[0.84rem] font-extrabold text-[#64748b] dark:text-[#a9b9cf]">
                      <span>
                        <i aria-hidden="true" className="fas fa-star mr-2 text-workly-primary" />
                        {serviceRating(service)}
                      </span>
                      <span>
                        <i aria-hidden="true" className="fas fa-user mr-2 text-workly-primary" />
                        {service.nomeFreelancer || 'Freelancer'}
                      </span>
                    </div>
                    <div className="grid gap-1 rounded-[18px] border border-workly-primary/16 bg-workly-primary/8 px-4 py-3.5">
                      <span className="text-[0.78rem] font-black text-[#64748b] dark:text-[#a9b9cf]">
                        Valor do serviço
                      </span>
                      <strong className="text-[1.26rem] leading-[1.15] text-[#039447] dark:text-[#86efac]">
                        {service.valorCombinar ? 'Valor a combinar' : formatCurrency(service.preco)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <LoadingState message="Carregando resumo..." detail="" />
                )}
              </div>
            </div>
            <div className={`${surface} flex items-start gap-[13px] p-5`}>
              <i
                aria-hidden="true"
                className="fas fa-route grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[15px] bg-workly-primary/10 text-workly-primary"
              />
              <div>
                <strong className="mb-[3px] block text-[0.98rem]">Depois da confirmação</strong>
                <p className="text-[0.9rem] leading-[1.45] font-semibold text-[#5f718a] dark:text-[#a9b9cf]">
                  Você acompanha o andamento na página de contratos.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </CatalogShell>
  );
}
