import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import CatalogShell from '../components/catalog/CatalogShell';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import { LoadingState } from '../components/ui/Feedback';
import { buscarUsuarioAtual, obterToken } from '../services/authService';
import {
  categories,
  defaultServiceImage,
  formatCurrency,
  serviceDetail
} from '../services/catalogService';
import { createGuides, editGuides } from '../services/serviceFormGuides';
import { serviceFormPayload, saveService } from '../services/serviceEditorService';
import { showAuthAlert } from '../components/auth/authPresentation';

const surface =
  'rounded-[24px] border border-[#e2e8f0]/95 bg-white/96 shadow-[0_10px_26px_rgba(15,23,42,0.06)] legacy-max-760:rounded-[20px] dark:border-[#94a3b8]/18 dark:bg-[#0f172a]/92';
const input =
  'w-full min-w-0 rounded-[14px] border border-[#94a3b8]/28 bg-white text-[0.96rem] text-[#0f172a] outline-none focus:border-workly-primary/58 focus:shadow-[0_0_0_4px_rgba(4,191,85,0.11)] dark:border-[#94a3b8]/24 dark:bg-[#020617]/44 dark:text-[#f8fafc]';
const label = 'mb-2 block text-[0.82rem] font-[850] text-[#475569] dark:text-[#9ca3af]';
const number =
  'grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] bg-workly-primary/12 font-black text-workly-primary';
function Heading({ step, title, text }) {
  return (
    <div className="mb-5 flex items-start gap-[14px] legacy-max-760:gap-[11px]">
      <span className={number}>{step}</span>
      <div className="min-w-0">
        <h2 className="text-[1.18rem] leading-[1.2] font-[850] text-[#0f172a] dark:text-[#f8fafc]">
          {title}
        </h2>
        <p className="mt-[5px] text-[0.88rem] leading-[1.45] text-[#64748b] dark:text-[#9ca3af]">
          {text}
        </p>
      </div>
    </div>
  );
}
export default function ServiceEditorPage({ editing = false }) {
  const [params] = useSearchParams(),
    id = params.get('id'),
    navigate = useNavigate(),
    fileInput = useRef(null),
    form = useRef(null);
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [file, setFile] = useState(null),
    [cover, setCover] = useState(defaultServiceImage),
    [drag, setDrag] = useState(false);
  const [values, setValues] = useState({
    genero_id: '',
    nome: '',
    descricao: '',
    extra: '',
    preco: '',
    valorCombinar: false
  });
  useEffect(() => {
    let active = true;
    setReady(false);
    (async () => {
      const user = await buscarUsuarioAtual(true);
      if (!active) return;
      if (!obterToken() || !user) {
        if (!editing)
          await showAuthAlert({
            icon: 'warning',
            title: 'Faça login primeiro',
            text: 'Você precisa estar logado para publicar um anúncio.',
            confirmText: 'Ir para login'
          });
        if (active) navigate('/login', { replace: true });
        return;
      }
      if (!editing && user.tipoConta !== 'Freelancer') {
        await showAuthAlert({
          icon: 'error',
          title: 'Acesso restrito',
          text: 'Somente contas Freelancer podem publicar serviços.',
          confirmText: 'Ir para perfil'
        });
        if (active) navigate('/perfil', { replace: true });
        return;
      }
      if (editing) {
        if (!id) {
          navigate('/perfil', { replace: true });
          return;
        }
        try {
          const { service } = await serviceDetail(id);
          if (!active) return;
          if (String(service.idUsuario) !== String(user.idUsuario)) {
            await showAuthAlert({
              icon: 'error',
              title: 'Acesso negado',
              text: 'Você só pode editar serviços criados por você.'
            });
            if (active) navigate('/detalhe-servico?id=' + id, { replace: true });
            return;
          }
          setValues({
            genero_id: String(service.categoriaId || ''),
            nome: service.nome || '',
            descricao: service.descricao || '',
            extra: service.extra || '',
            preco: service.valorCombinar ? '' : service.preco || '',
            valorCombinar: Boolean(service.valorCombinar)
          });
          setCover(service.imagemServico || defaultServiceImage);
        } catch (error) {
          if (active) {
            await showAuthAlert({
              icon: 'error',
              title: 'Erro ao carregar',
              text: error.message || 'Não foi possível carregar o serviço.'
            });
            navigate('/perfil', { replace: true });
          }
          return;
        }
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [editing, id, navigate]);
  const guide = (editing ? editGuides : createGuides)[values.genero_id];
  const titlePlaceholder = editing
    ? guide?.titlePlaceholder
    : guide
      ? 'Ex: ' + guide.titleExample
      : null;
  const descriptionPlaceholder = editing
    ? guide?.descriptionPlaceholder
    : guide?.descriptionExample;
  const extraPlaceholder = guide?.extraPlaceholder;
  const set = (key, value) =>
    setValues((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'valorCombinar' && value ? { preco: '' } : {})
    }));
  function choose(selected) {
    setFile(selected || null);
    if (!selected) {
      if (!editing) setCover(defaultServiceImage);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setCover(event.target.result);
    reader.readAsDataURL(selected);
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!form.current.checkValidity()) {
      form.current.reportValidity();
      return;
    }
    const body = serviceFormPayload(form.current, editing, values.valorCombinar);
    if (file) body.set('imagem_servico', file);
    setBusy(true);
    try {
      const response = await saveService(body, editing ? id : undefined),
        created = response?.dados || response?.servico || response,
        createdId = created?.idServico || created?._id || created?.id;
      await showAuthAlert({
        icon: 'success',
        title: editing ? 'Serviço atualizado!' : 'Serviço publicado!',
        text: editing
          ? 'As alterações foram salvas com sucesso.'
          : 'Seu serviço foi criado com sucesso.',
        confirmText: editing ? 'OK' : 'Ver serviço'
      });
      navigate(
        editing
          ? '/detalhe-servico?id=' + id
          : createdId
            ? '/detalhe-servico?id=' + createdId
            : '/perfil#services'
      );
    } catch (error) {
      await showAuthAlert({
        icon: 'error',
        title: editing ? 'Erro ao salvar' : 'Erro ao publicar',
        text:
          error.message ||
          (editing
            ? 'Não foi possível atualizar o serviço.'
            : 'Ocorreu um erro ao criar o serviço.'),
        confirmText: editing ? 'OK' : 'Fechar'
      });
    } finally {
      setBusy(false);
    }
  }
  const button =
    'min-h-[52px] rounded-[14px] px-[22px] font-[850] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-workly-primary legacy-max-760:w-full disabled:opacity-72';
  return (
    <CatalogShell title={editing ? 'Editar anúncio - Workly' : 'Criar anúncio - Workly'}>
      <main className="workly-editor-page mx-auto w-[calc(100%-48px)] max-w-[1160px] pt-[34px] pb-[76px] legacy-max-760:w-[calc(100%-28px)] legacy-max-760:pt-6 legacy-max-760:pb-14">
        <section className="mb-6 max-w-[800px]">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-workly-primary/12 px-3 py-2 text-[0.82rem] font-[850] text-[#039848]">
            <i
              aria-hidden="true"
              className={`fas ${editing ? 'fa-pen-to-square' : 'fa-plus-circle'}`}
            />
            {editing ? 'Editar serviço' : 'Novo serviço'}
          </span>
          <h1 className="m-0 text-[4.3rem] leading-[0.95] font-bold break-words text-[#0f172a] legacy-max-1200:text-[3rem] legacy-max-820:text-[2.4rem] legacy-max-760:text-[2.35rem] dark:text-[#f8fafc]">
            {editing && !ready
              ? 'Carregando anúncio...'
              : editing
                ? 'Editar anúncio'
                : 'Criar anúncio'}
          </h1>
          <p className="mt-[14px] max-w-[720px] text-base leading-[1.65] text-[#475569] dark:text-[#9ca3af]">
            {editing
              ? 'Atualize as informações do serviço, a capa, os entregáveis e o valor exibido para o cliente.'
              : 'Cadastre um serviço com título, categoria, descrição, entregáveis, capa e preço.'}
          </p>
        </section>
        {!ready ? (
          <LoadingState message={editing ? 'Carregando anúncio...' : 'Carregando...'} />
        ) : (
          <form
            ref={form}
            onSubmit={submit}
            noValidate
            className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-[22px] legacy-max-980:grid-cols-1"
          >
            <div className="grid min-w-0 gap-4">
              <section className={`${surface} p-6 legacy-max-760:p-[18px]`}>
                <Heading
                  step="1"
                  title="Informações principais"
                  text={
                    editing
                      ? 'Use um título direto e mantenha a categoria correta para facilitar a busca.'
                      : 'Use um título direto e escolha a categoria correta para o serviço aparecer no lugar certo.'
                  }
                />
                <div className="grid grid-cols-[230px_minmax(0,1fr)] gap-4 legacy-max-760:grid-cols-1">
                  <FormField
                    id="genero_servico"
                    name="genero_id"
                    label={
                      <>
                        Categoria <span className="text-[#ef4444]">*</span>
                      </>
                    }
                    as="select"
                    required
                    value={values.genero_id}
                    onChange={(event) => set('genero_id', event.target.value)}
                    appearance="custom"
                    wrapperClassName="min-w-0"
                    labelClassName={label}
                    className={`${input} min-h-[54px] px-[15px]`}
                  >
                    <option value="">Selecione...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.navName || category.name}
                      </option>
                    ))}
                  </FormField>
                  <div className="relative min-w-0">
                    <FormField
                      id="adDescription"
                      name="nome"
                      label={
                        <>
                          Título do anúncio <span className="text-[#ef4444]">*</span>
                        </>
                      }
                      required
                      minLength={10}
                      maxLength={70}
                      autoComplete="off"
                      value={values.nome}
                      onChange={(event) => set('nome', event.target.value)}
                      placeholder={titlePlaceholder || 'Ex: Pacote de cortes para podcast'}
                      appearance="custom"
                      wrapperClassName="min-w-0"
                      labelClassName={label}
                      className={`${input} min-h-[54px] pl-[15px] pr-[72px] font-[750]`}
                    />
                    <span
                      id="charCount"
                      className="absolute right-[14px] bottom-[15px] text-[0.78rem] font-extrabold text-[#64748b]"
                    >
                      {values.nome.length}/70
                    </span>
                  </div>
                </div>
              </section>
              {[
                [
                  'descricao',
                  'serviceDetails',
                  '2',
                  'Descrição',
                  editing
                    ? 'Explique o que o serviço entrega e quando ele faz sentido para o cliente.'
                    : 'Explique o que você faz, para quem é o serviço e qual resultado o cliente recebe.',
                  420,
                  descriptionPlaceholder ||
                    'Ex: Cortes verticais com legenda, cortes secos, trilha leve e acabamento para TikTok, Reels e Shorts.',
                  editing
                    ? 'Fale do resultado final, não só da tarefa.'
                    : 'Evite texto genérico. Fale do resultado final.'
                ],
                [
                  'extra',
                  'serviceExtra',
                  '3',
                  'Entregáveis',
                  editing
                    ? 'Informe o que está incluso, limites do pacote e o que o cliente precisa enviar.'
                    : 'Descreva exatamente o que está incluso no serviço e quais informações o cliente precisa enviar.',
                  700,
                  extraPlaceholder ||
                    'Ex: Inclui até 5 cortes, legenda básica, exportação em 1080x1920 e 1 rodada de ajustes. O cliente deve enviar o vídeo bruto e referências de estilo.',
                  'Esse texto aparece na página de detalhes do serviço.'
                ]
              ].map(([key, fieldId, step, title, text, max, placeholder, hint]) => (
                <section key={key} className={`${surface} p-6 legacy-max-760:p-[18px]`}>
                  <Heading step={step} title={title} text={text} />
                  <textarea
                    id={fieldId}
                    name={key}
                    aria-label={title}
                    required={key === 'descricao'}
                    minLength={key === 'descricao' ? 50 : undefined}
                    maxLength={max}
                    value={values[key]}
                    onChange={(event) => set(key, event.target.value)}
                    placeholder={placeholder}
                    className={`${input} block resize-y p-[15px] leading-[1.55] ${key === 'descricao' ? 'min-h-[160px]' : 'min-h-[150px]'}`}
                  />
                  <div className="mt-2 flex justify-between gap-[14px] text-[0.82rem] leading-[1.45] text-[#64748b] dark:text-[#9ca3af]">
                    <small>
                      <i
                        aria-hidden="true"
                        className={`fas ${key === 'descricao' ? 'fa-lightbulb' : 'fa-circle-info'} mr-1 text-workly-primary`}
                      />
                      {hint}
                    </small>
                    <span
                      className="shrink-0"
                      id={key === 'descricao' ? 'detailsCount' : 'extraCount'}
                    >
                      {values[key].length}/{max}
                    </span>
                  </div>
                </section>
              ))}
              <section className={`${surface} p-6 legacy-max-760:p-[18px]`}>
                <Heading
                  step="4"
                  title="Preço"
                  text={
                    editing
                      ? 'Defina um valor fixo ou marque como valor a combinar.'
                      : 'Use valor fixo quando o pacote já estiver definido. Use valor a combinar quando depender do escopo.'
                  }
                />
                <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-[14px] legacy-max-760:grid-cols-1">
                  <label
                    htmlFor="servicePrice"
                    className={`${input} flex min-h-[68px] items-center px-[14px] focus-within:border-workly-primary/58 ${values.valorCombinar ? 'bg-[#f8fafc]! opacity-60' : ''}`}
                  >
                    <span className="mr-2 text-[1.05rem] font-[850]">R$</span>
                    <input
                      id="servicePrice"
                      name="preco"
                      aria-label="Preço"
                      type="number"
                      min={20}
                      step="0.01"
                      required={!values.valorCombinar}
                      disabled={values.valorCombinar}
                      value={values.preco}
                      onChange={(event) => set('preco', event.target.value)}
                      placeholder={
                        values.valorCombinar
                          ? 'Valor a combinar'
                          : (editing ? guide?.pricePlaceholder : guide?.priceExample) || '680'
                      }
                      className="w-full min-w-0 border-0 bg-transparent text-[1.22rem] font-[850] outline-none"
                    />
                  </label>
                  <label
                    className={`${input} grid min-h-[68px] cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-[14px] py-3`}
                  >
                    <input
                      name="valorCombinar"
                      type="checkbox"
                      checked={values.valorCombinar}
                      onChange={(event) => set('valorCombinar', event.target.checked)}
                      className="h-[18px] w-[18px] accent-workly-primary"
                    />
                    <span>
                      <strong className="block text-[0.95rem]">Valor a combinar</strong>
                      <small className="mt-0.5 block text-[0.8rem] leading-[1.35] text-[#64748b]">
                        {editing
                          ? 'Use quando o preço depender do escopo do cliente.'
                          : 'O cliente conversa antes de fechar o valor.'}
                      </small>
                    </span>
                  </label>
                </div>
              </section>
              <div className="mt-0.5 flex justify-end gap-3 legacy-max-760:flex-col-reverse">
                <Button
                  appearance="custom"
                  className={`${button} border border-[#94a3b8]/28 bg-white text-[#475569] dark:bg-[#020617]/44 dark:text-[#f8fafc]`}
                  onClick={() =>
                    editing
                      ? navigate('/detalhe-servico?id=' + id)
                      : history.length > 1
                        ? history.back()
                        : navigate('/perfil#services')
                  }
                >
                  <i className="fas fa-arrow-left" aria-hidden="true" /> Cancelar
                </Button>
                <Button
                  type="submit"
                  appearance="custom"
                  disabled={busy}
                  className={`${button} bg-[linear-gradient(135deg,#04bf55,#07d464)] text-white shadow-[0_14px_26px_rgba(4,191,85,0.24)]`}
                >
                  <i
                    aria-hidden="true"
                    className={`fas ${busy ? 'fa-spinner fa-spin' : editing ? 'fa-check' : 'fa-paper-plane'}`}
                  />{' '}
                  {busy
                    ? editing
                      ? 'Salvando...'
                      : 'Publicando...'
                    : editing
                      ? 'Salvar alterações'
                      : 'Publicar anúncio'}
                </Button>
              </div>
              {busy && <LoadingState inline message={editing ? 'Salvando...' : 'Publicando...'} />}
            </div>
            <aside className="sticky top-[92px] grid min-w-0 gap-4 legacy-max-980:static legacy-max-980:grid-cols-2 legacy-max-760:grid-cols-1">
              <section className={`${surface} p-[18px]`}>
                <div className="flex gap-[14px]">
                  <i aria-hidden="true" className={`fas fa-image ${number}`} />
                  <div>
                    <h2 className="text-[1.18rem] leading-[1.2] font-[850]">Capa do serviço</h2>
                    <p className="mt-[5px] text-[0.88rem] leading-[1.45] text-[#64748b]">
                      Opcional
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  <div
                    id="imagePreview"
                    className="aspect-[16/10] overflow-hidden rounded-[18px] border border-[#94a3b8]/28 bg-[#0f172a]"
                  >
                    <img
                      src={cover}
                      alt={
                        cover === defaultServiceImage ? 'Capa padrão do serviço' : 'Capa do serviço'
                      }
                      onError={(event) => {
                        if (
                          event.currentTarget.src !==
                          new URL(defaultServiceImage, location.origin).href
                        )
                          event.currentTarget.src = defaultServiceImage;
                      }}
                      className="block h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    id="uploadArea"
                    onClick={() => fileInput.current.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDrag(false);
                      choose(event.dataTransfer.files?.[0]);
                    }}
                    className={`grid min-h-[86px] place-items-center gap-1 rounded-[18px] border-[1.5px] border-dashed border-[#94a3b8]/50 bg-[#f8fafc]/82 p-4 text-center focus-visible:outline-2 focus-visible:outline-workly-primary dark:bg-[#020617]/44 ${drag ? 'border-workly-primary bg-workly-primary/8' : ''}`}
                  >
                    <i
                      aria-hidden="true"
                      className="fas fa-cloud-upload-alt text-[1.55rem] text-workly-primary"
                    />
                    <span className="text-[0.9rem] font-[850]">Escolher imagem</span>
                    <small className="text-[0.75rem] text-[#64748b]">PNG, JPG ou WEBP</small>
                  </button>
                  <input
                    ref={fileInput}
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    name="imagem_servico"
                    onChange={(event) => choose(event.target.files?.[0])}
                    className="hidden"
                  />
                </div>
              </section>
              <section aria-label="Prévia do anúncio" className={`${surface} p-[18px]`}>
                <div className="flex gap-[14px]">
                  <i aria-hidden="true" className={`fas fa-eye ${number}`} />
                  <div>
                    <h2 className="text-[1.18rem] leading-[1.2] font-[850]">Prévia</h2>
                    <p className="mt-[5px] text-[0.88rem] leading-[1.45] text-[#64748b]">
                      {editing
                        ? 'Resumo do anúncio atualizado'
                        : 'Como o anúncio começa a aparecer'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-[18px] border border-[#e2e8f0]/95 bg-[linear-gradient(180deg,#f8fafc,#ffffff)] p-4 dark:border-[#94a3b8]/18 dark:bg-transparent dark:bg-[linear-gradient(180deg,#0f172a,#0f172a)]">
                  <span
                    id="previewCategory"
                    className="inline-flex rounded-full bg-workly-primary/12 px-2.5 py-1.5 text-[0.75rem] font-[850] text-[#039848]"
                  >
                    {guide?.label || 'Categoria'}
                  </span>
                  <h3
                    id="previewTitle"
                    className="mt-3 mb-2 text-[1.05rem] leading-[1.25] font-[850] break-words"
                  >
                    {values.nome.trim() || 'Título do anúncio'}
                  </h3>
                  <p
                    id="previewDescription"
                    className="mb-[14px] text-[0.86rem] leading-[1.45] break-words text-[#475569] dark:text-[#9ca3af]"
                  >
                    {values.descricao.trim() || 'A descrição aparece aqui conforme você escreve.'}
                  </p>
                  <strong id="previewPrice" className="text-[1.08rem] font-black">
                    {values.valorCombinar
                      ? 'Valor a combinar'
                      : Number.isFinite(Number(values.preco)) && Number(values.preco) > 0
                        ? formatCurrency(values.preco)
                        : 'Defina o preço'}
                  </strong>
                </div>
              </section>
            </aside>
          </form>
        )}
      </main>
    </CatalogShell>
  );
}
