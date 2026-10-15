import { useEffect, useState } from 'react';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import { LoadingState } from '../ui/Feedback';
import { showAuthAlert } from '../auth/authPresentation';
import {
  updateProfile,
  updateAccountType,
  updatePassword,
  deleteAccount
} from '../../services/profileService';
import { limparSessao, obterUsuario } from '../../services/authService';
import { defaultProfileImage } from '../../services/catalogService';

const control =
  'w-full min-w-0 rounded-lg border border-[#e0e0e0] bg-white px-[15px] py-3 text-base [line-height:normal] text-[#111827] outline-none focus:border-workly-primary focus:shadow-[0_0_0_3px_#8fd9af] dark:border-[rgba(94,130,172,0.22)] dark:bg-[rgba(10,18,34,0.92)] dark:text-workly-dark-text';
export const saveStyle =
  'rounded-lg border-0 bg-workly-primary px-[25px] py-3 font-semibold text-white hover:bg-[#038a3d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-workly-primary disabled:opacity-50';
export const cancelStyle =
  'rounded-lg border-0 bg-[#e4e4e4] px-[25px] py-3 font-semibold text-[#333] hover:bg-[#dbdbdb] focus-visible:outline-2 focus-visible:outline-workly-primary dark:bg-[#1e293b] dark:text-workly-dark-text';
const sections = [
  ['profile', 'Perfil', 'fa-user', 'Configurações de Perfil'],
  ['portfolio', 'Portfólio', 'fa-briefcase', 'Portfólio e Serviços'],
  ['account', 'Conta', 'fa-cog', 'Conta'],
  ['billing', 'Pagamentos', 'fa-credit-card', 'Pagamentos'],
  ['notification', 'Notificações', 'fa-bell', 'Notificações'],
  ['security', 'Segurança', 'fa-shield-alt', 'Segurança']
];
const areas = [
  'Design',
  'Programação',
  'Vídeo/Edição',
  'Inteligência Artificial',
  'Escrita/Tradução',
  'Fotografia',
  'Áudio/Música'
];
function initialFields(user) {
  const parts = String(user.nome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return {
    ...user,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
    notificacoesEmail: user.notificacoesEmail ?? true,
    notificacoesPropostas: user.notificacoesPropostas ?? true,
    notificacoesMarketing: user.notificacoesMarketing ?? false,
    doisFatores: user.doisFatores ?? false
  };
}
export default function ProfileSettings({ user, reload, onPhoto }) {
  const [active, setActive] = useState('profile'),
    [values, setValues] = useState(() => initialFields(user)),
    [busy, setBusy] = useState(false);
  useEffect(() => setValues(initialFields(user)), [user]);
  const set = (key, value) => setValues((previous) => ({ ...previous, [key]: value }));
  function field(key, label, type = 'text', placeholder = '', options) {
    return (
      <FormField
        key={key}
        id={key}
        name={key}
        label={label}
        appearance="custom"
        className={`${control} ${['linkedin', 'github', 'instagram'].includes(key) ? 'rounded-l-none' : ''}`}
        wrapperClassName={
          ['linkedin', 'github', 'instagram'].includes(key) ? 'min-w-0 flex-1' : undefined
        }
        labelClassName={
          ['linkedin', 'github', 'instagram'].includes(key)
            ? 'sr-only'
            : 'mb-2 block font-medium dark:text-[#e5eefb]'
        }
        type={options ? undefined : type}
        as={options ? 'select' : type === 'textarea' ? 'textarea' : 'input'}
        value={values[key] || ''}
        onChange={(event) => set(key, event.target.value)}
        placeholder={placeholder}
        rows={type === 'textarea' ? 4 : undefined}
        minLength={['novaSenha', 'confirmarSenha'].includes(key) ? 8 : undefined}
        autoComplete={
          type === 'password'
            ? key === 'senhaAtual'
              ? 'current-password'
              : 'new-password'
            : undefined
        }
      >
        {options?.map((option) => (
          <option key={option} value={option === options[0] ? '' : option}>
            {option}
          </option>
        ))}
      </FormField>
    );
  }
  function toggle(key, title, description) {
    return (
      <label
        key={key}
        className="mb-3 flex min-w-0 items-center justify-between gap-4 rounded-xl border border-[#94a3b8]/18 bg-[#f8fafc] p-4 dark:bg-[#0f172a]/55"
      >
        <span className="min-w-0">
          <strong className="block">{title}</strong>
          <small className="block text-[#64748b] dark:text-[#a9b9cf]">{description}</small>
        </span>
        <input
          type="checkbox"
          aria-label={title}
          checked={Boolean(values[key])}
          onChange={(event) => set(key, event.target.checked)}
          className="h-[18px] w-[18px] shrink-0 accent-workly-primary focus-visible:outline-2 focus-visible:outline-workly-primary"
        />
      </label>
    );
  }
  const group = (keys) => Object.fromEntries(keys.map((key) => [key, values[key] || '']));
  async function submit(event, section) {
    event?.preventDefault();
    if (busy) return;
    if (section === 'account') {
      if (values.tipoConta === 'Freelancer' && !values.areaAtuacao) {
        await showAuthAlert({
          icon: 'warning',
          title: 'Informe a área de atuação',
          text: 'Para usar a conta como freelancer, selecione uma área de atuação.',
          confirmText: 'Entendi'
        });
        return;
      }
      if (
        !(
          await showAuthAlert({
            icon: 'warning',
            title: 'Alterar tipo de conta?',
            text: 'Essa mudança pode alterar permissões, serviços disponíveis e a visualização do seu perfil.',
            confirmText: 'Confirmar',
            cancelText: 'Cancelar'
          })
        ).isConfirmed
      )
        return;
    }
    const titles = {
      profile: 'Perfil atualizado!',
      portfolio: 'Portfólio atualizado!',
      account: 'Tipo de conta atualizado!',
      billing: 'Pagamentos atualizados!',
      notification: 'Notificações atualizadas!',
      security: 'Senha atualizada!',
      preferences: 'Preferências de segurança salvas!'
    };
    const errors = {
      profile: ['Erro ao atualizar perfil', 'Não foi possível salvar as alterações do seu perfil.'],
      portfolio: ['Erro ao salvar', 'Não foi possível salvar o portfólio.'],
      account: [
        'Não foi possível alterar',
        'Verifique se você possui serviços publicados ou contratos ativos antes de mudar o tipo da conta.'
      ],
      billing: ['Erro ao salvar', 'Não foi possível salvar os dados de pagamento.'],
      notification: ['Erro ao salvar', 'Não foi possível salvar as notificações.'],
      security: ['Erro ao atualizar senha', 'Não foi possível atualizar a senha.'],
      preferences: ['Erro ao salvar', 'Não foi possível salvar as preferências de segurança.']
    };
    setBusy(true);
    try {
      let result;
      if (section === 'account')
        result = await updateAccountType(group(['tipoConta', 'areaAtuacao']));
      else if (section === 'security') {
        result = await updatePassword(group(['senhaAtual', 'novaSenha', 'confirmarSenha']));
        setValues((previous) => ({
          ...previous,
          senhaAtual: '',
          novaSenha: '',
          confirmarSenha: '',
          doisFatores: obterUsuario()?.doisFatores || false
        }));
      } else {
        const payload =
          section === 'profile'
            ? {
                ...group([
                  'email',
                  'telefone',
                  'tituloProfissional',
                  'bio',
                  'localizacao',
                  'site',
                  'linkedin',
                  'github',
                  'instagram',
                  'areaAtuacao'
                ]),
                nome: `${values.firstName || ''} ${values.lastName || ''}`.trim()
              }
            : section === 'portfolio'
              ? group([
                  'portfolioTitulo',
                  'portfolioDescricao',
                  'portfolioUrl',
                  'disponibilidade',
                  'precoHora'
                ])
              : section === 'billing'
                ? group(['metodoPagamento', 'chavePix', 'banco'])
                : section === 'preferences'
                  ? { doisFatores: Boolean(values.doisFatores) }
                  : Object.fromEntries(
                      ['notificacoesEmail', 'notificacoesPropostas', 'notificacoesMarketing'].map(
                        (key) => [key, Boolean(values[key])]
                      )
                    );
        result = await updateProfile(payload);
      }
      if (section !== 'security' && section !== 'profile') await reload();
      await showAuthAlert({
        icon: 'success',
        title: titles[section],
        text:
          result.mensagem ||
          (section === 'profile'
            ? 'As informações do seu perfil foram salvas com sucesso.'
            : section === 'security'
              ? 'Sua senha foi alterada com sucesso.'
              : section === 'account'
                ? 'A configuração da conta foi alterada com sucesso.'
                : 'Alterações salvas com sucesso.'),
        confirmText: 'Continuar'
      });
      if (section === 'profile') await reload();
    } catch (error) {
      await showAuthAlert({
        icon: 'error',
        title: errors[section][0],
        text: error.message || errors[section][1],
        confirmText: 'Fechar'
      });
    } finally {
      setBusy(false);
    }
  }
  async function remove(event) {
    event.preventDefault();
    if (
      !(
        await showAuthAlert({
          icon: 'warning',
          title: 'Excluir conta?',
          text: 'Tem certeza que deseja excluir sua conta? Esta ação é irreversível.',
          confirmText: 'Excluir',
          cancelText: 'Cancelar'
        })
      ).isConfirmed
    )
      return;
    setBusy(true);
    try {
      const result = await deleteAccount();
      await showAuthAlert({
        icon: 'success',
        title: 'Conta excluída',
        text: result.mensagem || 'Sua conta foi excluída com sucesso.',
        confirmText: 'OK'
      });
      limparSessao();
      location.assign('/');
    } catch (error) {
      await showAuthAlert({
        icon: 'error',
        title: 'Erro ao excluir conta',
        text: error.message || 'Não foi possível excluir sua conta.',
        confirmText: 'Fechar'
      });
    } finally {
      setBusy(false);
    }
  }
  function actions(label, section) {
    return (
      <div className="mt-[30px] flex flex-wrap gap-[15px]">
        <Button
          type="submit"
          appearance="custom"
          disabled={busy}
          className={`${saveStyle} text-[13.3333px] [line-height:normal]`}
        >
          {label}
        </Button>
        <Button
          type="button"
          appearance="custom"
          className="rounded-lg border border-[#e0e0e0] bg-transparent px-[25px] py-3 text-[13.3333px] [line-height:normal] font-semibold text-[#9e9e9e] focus-visible:outline-2 focus-visible:outline-workly-primary dark:border-[#5e82ac]/22 dark:text-[#eef4ff]"
          onClick={section === 'profile' ? undefined : reload}
        >
          Cancelar
        </Button>
      </div>
    );
  }
  const row = 'mb-5 flex gap-5 [&>div]:flex-1 [&>div]:mb-0 legacy-max-920:flex-col';
  return (
    <div className="flex items-start gap-8 legacy-max-920:flex-col">
      <nav
        aria-label="Configurações"
        className="w-[250px] shrink-0 overflow-hidden rounded-[18px] border border-[#94a3b8]/16 bg-white/72 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] legacy-max-920:w-full dark:rounded-3xl dark:bg-transparent dark:bg-[linear-gradient(160deg,rgba(14,22,38,.82),rgba(12,20,34,.76))]"
      >
        <div className="flex flex-col dark:bg-[#1b2738] legacy-max-920:flex-row legacy-max-920:flex-wrap legacy-max-920:gap-2.5 legacy-max-920:px-2.5">
          {sections.map(([key, label, icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              aria-current={active === key ? 'page' : undefined}
              className={`flex items-center gap-2.5 border-l-4 px-[25px] py-[15px] text-left font-medium focus-visible:outline-2 focus-visible:outline-workly-primary legacy-max-920:rounded-lg legacy-max-920:px-[15px] legacy-max-920:py-2.5 legacy-max-600:px-3! legacy-max-600:py-2! legacy-max-600:text-[.9rem] ${active === key ? 'border-workly-primary bg-workly-primary/18 text-workly-primary legacy-max-920:border-l-0 legacy-max-920:border-b-[3px] dark:legacy-max-920:border-l-4! dark:bg-transparent dark:bg-[linear-gradient(90deg,rgba(4,191,85,.18),rgba(4,191,85,.08))] dark:text-[#4ade80]' : 'border-transparent text-[#1f2937] hover:bg-[#f8f9fa] hover:text-workly-primary dark:text-[#e5eefb] dark:hover:bg-workly-primary/10'}`}
            >
              <i aria-hidden="true" className={`fas ${icon} w-5 text-center`} />
              {label}
            </button>
          ))}
        </div>
      </nav>
      <div className="flex-1 rounded-[15px] pt-2 dark:rounded-3xl legacy-max-600:w-full">
        {sections.map(([key, , , heading]) => (
          <section key={key} hidden={active !== key}>
            <h2 className="mb-5 text-2xl [line-height:normal] font-bold text-workly-primary dark:text-[#e5eefb]">
              {heading}
            </h2>
            {key === 'profile' && (
              <>
                <div className="mb-[25px] max-w-[800px]">
                  <div className="mb-5">
                    <p className="mb-2 font-medium">Foto de Perfil</p>
                    <div className="flex items-center gap-5 legacy-max-576:flex-col legacy-max-576:items-start">
                      <img
                        src={user.fotoPerfil || defaultProfileImage}
                        alt="Foto de perfil atual"
                        className="h-24 w-24 shrink-0 rounded-full object-cover"
                      />
                      <div className="flex flex-col items-start justify-center gap-2 legacy-max-600:items-center">
                        <Button
                          appearance="custom"
                          className="relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-[linear-gradient(135deg,#08c765,#04984e)] px-5 py-[13px] text-[13.3333px] [line-height:normal] font-bold text-white dark:text-[#eef4ff] dark:bg-none dark:bg-[#162236] shadow-[0_12px_26px_rgba(0,200,83,0.28)] focus-visible:outline-2 focus-visible:outline-workly-primary"
                          onClick={onPhoto}
                        >
                          <i
                            className="fas fa-camera inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/18"
                            aria-hidden="true"
                          />{' '}
                          Alterar foto
                        </Button>
                        <p className="mt-2 max-w-[520px] text-[0.9rem] leading-[1.5] text-[#777] dark:text-[#e5eefb]">
                          Envie uma imagem JPG, PNG ou WEBP para deixar seu perfil mais
                          profissional.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <form onSubmit={(event) => submit(event, key)}>
                  <div className={row}>
                    {field('firstName', 'Nome', 'text', 'Seu nome')}
                    {field('lastName', 'Sobrenome', 'text', 'Seu sobrenome')}
                  </div>
                  {field(
                    'tituloProfissional',
                    'Título Profissional',
                    'text',
                    'Ex.: Desenvolvedor Web'
                  )}
                  {field(
                    'bio',
                    'Biografia',
                    'textarea',
                    'Fale um pouco sobre sua experiência e seus serviços.'
                  )}
                  <div className={row}>
                    {field('email', 'Email', 'email', 'seuemail@exemplo.com')}
                    {field('telefone', 'Telefone', 'tel', '(00) 00000-0000')}
                  </div>
                  {field('localizacao', 'Localização', 'text', 'Cidade, Estado')}
                  {field('site', 'Website', 'url', 'https://seusite.com')}
                  <div className="mb-5">
                    <p className="mb-2 font-medium">Redes Sociais</p>
                    <div className="flex flex-col gap-2.5">
                      {[
                        ['linkedin', 'LinkedIn', 'linkedin.com/in/seu-perfil'],
                        ['github', 'GitHub', 'github.com/seuusuario'],
                        ['instagram', 'Instagram', 'instagram.com/seuusuario']
                      ].map(([name, label, placeholder]) => (
                        <div key={name} className="flex items-center">
                          <i
                            aria-hidden="true"
                            className={`fab fa-${name} flex h-10 w-10 shrink-0 items-center justify-center rounded-l-lg border border-r-0 border-[#e0e0e0] bg-[#f8f9fa] text-[#9e9e9e]`}
                          />
                          {field(name, label, 'text', placeholder)}
                        </div>
                      ))}
                    </div>
                  </div>
                  {actions('Salvar Alterações', key)}
                </form>
                <form onSubmit={remove}>
                  <Button
                    appearance="custom"
                    type="submit"
                    className="[appearance:auto] border-2 border-[#767676] [border-style:outset] bg-[#efefef] px-0.5 py-px text-[13.3333px] [line-height:normal] text-black focus-visible:outline-2 focus-visible:outline-[#ef4444]"
                    disabled={busy}
                  >
                    <i aria-hidden="true" className="fa-solid fa-trash" /> Excluir conta
                  </Button>
                </form>
              </>
            )}
            {key === 'portfolio' && (
              <form onSubmit={(event) => submit(event, key)}>
                <div className="mb-5 flex gap-3 bg-[#04bf55]/8 p-[18px]">
                  <i aria-hidden="true" className="fas fa-circle-info text-workly-primary" />
                  <div>
                    <strong>Esses dados ajudam a montar uma vitrine profissional.</strong>
                    <p>
                      Por enquanto eles ficam salvos no seu perfil. Depois podem virar uma página
                      pública de portfólio.
                    </p>
                  </div>
                </div>
                {field(
                  'portfolioTitulo',
                  'Título do portfólio',
                  'text',
                  'Ex.: Sites modernos para pequenos negócios'
                )}
                {field(
                  'portfolioDescricao',
                  'Descrição do portfólio',
                  'textarea',
                  'Conte quais tipos de projetos você quer destacar.'
                )}
                <div className={row}>
                  {field('portfolioUrl', 'Link externo', 'url', 'https://meuportfolio.com')}
                  {field('disponibilidade', 'Disponibilidade', 'text', '', [
                    'Selecione',
                    'Disponível para novos projetos',
                    'Agenda parcial',
                    'Indisponível no momento'
                  ])}
                </div>
                {field(
                  'precoHora',
                  'Valor por hora / referência',
                  'text',
                  'Ex.: R$ 50/h ou a combinar'
                )}
                {actions('Salvar portfólio', key)}
              </form>
            )}
            {key === 'account' && (
              <>
                <div className="mb-[18px] flex gap-[14px]">
                  <i aria-hidden="true" className="fas fa-user-gear text-workly-primary" />
                  <div>
                    <strong>Tipo de conta</strong>
                    <p>
                      Essa alteração muda permissões, serviços e como seu perfil aparece na Workly.
                    </p>
                  </div>
                </div>
                <div className="mb-[18px] flex justify-between gap-3 bg-workly-primary/9 px-4 py-[14px]">
                  <span>Tipo atual</span>
                  <strong>{user.tipoConta || '--'}</strong>
                </div>
                <form onSubmit={(event) => submit(event, key)}>
                  <div className={row}>
                    <FormField
                      id="tipoConta"
                      label="Alterar para"
                      as="select"
                      appearance="custom"
                      className={control}
                      value={values.tipoConta || 'Freelancer'}
                      onChange={(event) => set('tipoConta', event.target.value)}
                    >
                      <option>Freelancer</option>
                      <option>Contratante</option>
                    </FormField>
                    <div hidden={values.tipoConta !== 'Freelancer'}>
                      {field('areaAtuacao', 'Área de atuação', 'text', '', [
                        'Selecione sua área...',
                        ...areas
                      ])}
                    </div>
                  </div>
                  <p className="mb-5 bg-[#f59e0b]/8 p-[18px]">
                    {values.tipoConta === 'Freelancer'
                      ? 'Para virar freelancer, escolha uma área de atuação. Isso libera recursos como publicar serviços e receber leads.'
                      : 'Para virar contratante, você não pode ter serviços publicados ou contratos ativos como freelancer.'}
                  </p>
                  {actions('Confirmar alteração', key)}
                </form>
              </>
            )}
            {key === 'billing' && (
              <form onSubmit={(event) => submit(event, key)}>
                <div className="mb-5 bg-workly-primary/8 p-[18px]">
                  <strong>Dados preparados para uma futura integração financeira.</strong>
                  <p>Nenhuma cobrança real é feita pelo sistema neste momento.</p>
                </div>
                <div className={row}>
                  {field('metodoPagamento', 'Método preferido', 'text', '', [
                    'Selecione',
                    'Pix',
                    'Transferência bancária',
                    'A combinar com o cliente'
                  ])}
                  {field(
                    'chavePix',
                    'Chave Pix',
                    'text',
                    'Email, CPF, telefone ou chave aleatória'
                  )}
                </div>
                {field(
                  'banco',
                  'Banco / observações',
                  'text',
                  'Ex.: Nubank, Banco do Brasil ou instruções de pagamento'
                )}
                {actions('Salvar pagamentos', key)}
              </form>
            )}
            {key === 'notification' && (
              <form onSubmit={(event) => submit(event, key)}>
                {toggle(
                  'notificacoesEmail',
                  'Notificações por email',
                  'Receber avisos importantes da conta.'
                )}
                {toggle(
                  'notificacoesPropostas',
                  'Novas propostas e mensagens',
                  'Avisos quando clientes demonstrarem interesse.'
                )}
                {toggle(
                  'notificacoesMarketing',
                  'Novidades e marketing',
                  'Receber dicas, promoções e atualizações da Workly.'
                )}
                {actions('Salvar notificações', key)}
              </form>
            )}
            {key === 'security' && (
              <form onSubmit={(event) => submit(event, key)}>
                <div className={row}>
                  {field('senhaAtual', 'Senha atual', 'password')}
                  {field('novaSenha', 'Nova senha', 'password')}
                </div>
                {field('confirmarSenha', 'Confirmar nova senha', 'password')}
                <p className="my-4 text-sm text-[#64748b] dark:text-[#a9b9cf]">
                  A verificação em duas etapas ainda não está disponível nesta versão.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Button type="submit" appearance="custom" className={saveStyle} disabled={busy}>
                    Atualizar senha
                  </Button>
                </div>
              </form>
            )}
          </section>
        ))}
        {busy && <LoadingState inline message="Salvando..." />}
      </div>
    </div>
  );
}
