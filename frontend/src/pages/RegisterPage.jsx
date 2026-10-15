import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import AuthShell from '../components/auth/AuthShell';
import AuthField from '../components/auth/AuthField';
import AuthHeader from '../components/auth/AuthHeader';
import AuthFooter from '../components/auth/AuthFooter';
import { showAuthAlert, registrationSubmitStyles } from '../components/auth/authPresentation';
import Button from '../components/ui/Button';
import { ErrorState, LoadingState } from '../components/ui/Feedback';
import { cadastrar } from '../services/authService';
import { areas, formatCpf, validateField, registrationPayload } from '../services/authValidation';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState('');
  const [cpf, setCpf] = useState('');
  const [states, setStates] = useState({});
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');
  function validate(control) {
    if (!control.name || control.name === 'newsletter') return '';
    return validateField(
      control.name,
      control.type === 'checkbox' ? control.checked : control.value,
      { required: control.required, type: control.type, senha: control.form.elements.senha.value }
    );
  }
  function blur(event) {
    const control = event.target;
    if (!control.name || control.name === 'newsletter') return;
    setStates((old) => ({ ...old, [control.name]: validate(control) }));
  }
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const errors = {};
    for (const control of form.querySelectorAll('input,select'))
      if (control.name !== 'newsletter') errors[control.name] = validate(control);
    setStates(errors);
    if (
      Object.values(errors).some(Boolean) ||
      form.elements.senha.value.trim() !== form.elements.confirmar_senha.value.trim() ||
      !form.elements.termos.checked
    ) {
      await showAuthAlert({
        icon: 'warning',
        title: 'Revise o formulário',
        text: 'Preencha os campos obrigatórios corretamente antes de continuar.',
        confirmText: 'Entendi'
      });
      return;
    }
    setBusy(true);
    setApiError('');
    try {
      const result = await cadastrar(registrationPayload(new FormData(form)));
      await showAuthAlert({
        icon: 'success',
        title: 'Perfil criado com sucesso!',
        text: result.mensagem || 'Sua conta foi criada. Agora é só fazer login e começar.',
        confirmText: 'Ir para login'
      });
      navigate('/login');
    } catch (err) {
      const text = err.message || 'Falha de conexão. Tente novamente em instantes.';
      setApiError(text);
      void showAuthAlert({
        icon: 'error',
        title: 'Não foi possível concluir o cadastro',
        text,
        confirmText: 'Fechar'
      }).then(() => setApiError(''));
    } finally {
      setBusy(false);
    }
  }
  const field = (id, label, props = {}) => (
    <AuthField
      key={id}
      variant="register"
      id={id}
      name={id}
      label={label}
      error={states[id]}
      valid={states[id] === ''}
      onBlur={blur}
      onChange={props.as === 'select' ? blur : undefined}
      {...props}
    />
  );
  return (
    <AuthShell>
      {(dark) => (
        <>
          <AuthHeader dark={dark} />
          <section className="mx-auto flex max-w-[1200px] items-start justify-between gap-14 px-5 pt-14 pb-6 backdrop-blur-[14px] legacy-max-1200:px-[15px] legacy-max-992:flex-col legacy-max-992:items-center legacy-max-980:gap-6 legacy-max-980:pt-8 dark:border dark:border-[rgba(94,130,172,0.18)] dark:bg-[linear-gradient(160deg,rgba(14,25,42,0.94),rgba(12,20,36,0.90))] dark:shadow-[0_22px_64px_rgba(0,4,18,0.42),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="relative z-[1] w-[45%] pt-12 pr-6 pb-6 legacy-max-992:mb-[30px] legacy-max-992:w-[80%] legacy-max-992:text-center legacy-max-980:w-full legacy-max-980:px-0">
              <h1 className="mb-[30px] text-[32px] leading-[normal] font-bold legacy-max-768:text-[28px] dark:text-[#eaf2ff]">
                "Entre para o melhor site de freelancer já visto"
              </h1>
              <ul className="mb-10 legacy-max-992:inline-block legacy-max-992:text-left">
                {[
                  'Referência no mercado',
                  'Trabalho de qualidade',
                  'Fidelidade 100% ao cliente'
                ].map((text) => (
                  <li
                    key={text}
                    className="relative mb-[15px] pl-[30px] text-lg leading-[normal]! before:absolute before:left-0 before:font-bold before:text-black before:content-['✓'] legacy-max-768:text-base dark:text-[#eaf2ff] dark:before:text-[#34d399]"
                  >
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative z-[1] w-[45%] pt-2 legacy-max-992:mb-[30px] legacy-max-992:w-[80%] legacy-max-980:w-full">
              <h2 className="mb-5 text-2xl leading-[normal] font-bold text-[#404145] dark:text-workly-dark-text">
                Crie sua conta
              </h2>
              <p className="font-semibold">Já tem uma conta?</p>
              <Link
                to="/login"
                className="mb-[25px] block font-semibold text-[#2196f3] focus-visible:outline-2 focus-visible:outline-workly-primary dark:text-workly-dark-text"
              >
                Faça login
              </Link>
              <div>
                {[
                  ['google', 'Google'],
                  ['facebook-f', 'Facebook'],
                  ['apple', 'Apple']
                ].map(([icon, label]) => (
                  <Button
                    key={icon}
                    appearance="custom"
                    className={`relative mb-[15px] block w-full overflow-hidden rounded-[10px] border border-[#ddd] bg-white p-3 text-center text-base leading-[normal] font-semibold transition-transform hover:-translate-y-0.5 hover:bg-[#f1f1f1] hover:shadow-[0_4px_8px_rgba(0,0,0,0.1)] focus-visible:outline-2 focus-visible:outline-workly-primary legacy-max-768:text-sm dark:border-[rgba(148,163,184,0.16)] dark:bg-[rgba(18,28,46,0.9)] dark:text-workly-dark-text ${icon === 'google' ? 'hover:border-[#4285f4] hover:text-[#4285f4]' : icon === 'facebook-f' ? 'hover:border-[#3b5998] hover:text-[#3b5998]' : 'hover:border-black hover:text-black'}`}
                  >
                    <i
                      aria-hidden="true"
                      className={`fab fa-${icon} absolute top-1/2 left-[15px] -translate-y-1/2 text-xl`}
                    />
                    Continue com {label}
                  </Button>
                ))}
              </div>
              <div className="relative my-[15px] text-center before:absolute before:top-1/2 before:left-0 before:w-[45%] before:border-b before:border-[#ddd] after:absolute after:top-1/2 after:right-0 after:w-[45%] after:border-b after:border-[#ddd]">
                ou
              </div>
              <form id="formCadastro" onSubmit={submit} className="mt-5" aria-busy={busy}>
                {field('nome', 'Nome Completo*', { required: true })}
                {field('email', 'E-mail*', { required: true, type: 'email' })}
                {field('senha', 'Senha*', { required: true, type: 'password', minLength: 8 })}
                {field('confirmar_senha', 'Confirmar Senha*', { required: true, type: 'password' })}
                {field('cpf', 'CPF*', {
                  required: true,
                  maxLength: 14,
                  inputMode: 'numeric',
                  autoComplete: 'off',
                  placeholder: '000.000.000-00',
                  value: cpf,
                  onChange: (event) => setCpf(formatCpf(event.target.value))
                })}
                {field('telefone', 'Telefone')}
                {field('tipo_conta', 'Você é*', {
                  as: 'select',
                  required: true,
                  value: tipo,
                  onChange: (event) => {
                    setTipo(event.target.value);
                    const area = event.target.form.elements.area_atuacao;
                    if (event.target.value !== 'Freelancer') area.value = '';
                    blur(event);
                  },
                  children: (
                    <>
                      <option value="">Selecione...</option>
                      <option value="Freelancer">Freelancer (Oferecer serviços)</option>
                      <option value="Contratante">Contratante (Contratar serviços)</option>
                    </>
                  )
                })}
                <div hidden={tipo !== 'Freelancer'}>
                  {field('area_atuacao', 'Área de Atuação*', {
                    as: 'select',
                    required: tipo === 'Freelancer',
                    children: (
                      <>
                        <option value="">Selecione sua área...</option>
                        {areas.map((area) => (
                          <option key={area}>{area}</option>
                        ))}
                      </>
                    )
                  })}
                </div>
                {['termos', 'newsletter'].map((id) => (
                  <div key={id} className="relative mb-[15px] flow-root min-w-0 pl-[30px]">
                    <input
                      id={id}
                      name={id}
                      type="checkbox"
                      required={id === 'termos'}
                      onBlur={blur}
                      onChange={blur}
                      className="peer absolute top-0 left-0 h-5 w-5 cursor-pointer opacity-0"
                    />
                    <label
                      htmlFor={id}
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 left-0 h-5 w-5 rounded border border-[#ddd] bg-white peer-checked:border-workly-primary peer-checked:bg-workly-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-workly-primary after:absolute after:top-[3px] after:left-[7px] after:hidden after:h-2.5 after:w-[5px] after:rotate-45 after:border-r-2 after:border-b-2 after:border-white peer-checked:after:block"
                    />
                    <label
                      htmlFor={id}
                      className="mb-2 block cursor-pointer text-[0.95rem] font-semibold text-[#333] legacy-max-576:text-[13px] dark:text-workly-dark-text"
                    >
                      {id === 'termos' ? (
                        <>
                          Eu li e aceito os{' '}
                          <a href="#" className="text-workly-primary hover:underline">
                            Termos de Serviço
                          </a>{' '}
                          e{' '}
                          <a href="#" className="text-workly-primary hover:underline">
                            Política de Privacidade
                          </a>
                          *
                        </>
                      ) : (
                        'Desejo receber novidades e promoções por e-mail'
                      )}
                    </label>
                    {states[id] && (
                      <ErrorState className="text-[0.83333rem] text-[#e74c3c] dark:text-workly-dark-text">
                        {states[id]}
                      </ErrorState>
                    )}
                  </div>
                ))}
                <Button
                  appearance="custom"
                  type="submit"
                  disabled={busy}
                  className={registrationSubmitStyles}
                >
                  {busy ? <LoadingState inline message="Criando conta..." /> : 'Criar Conta'}
                </Button>
                {apiError && <ErrorState className="sr-only">{apiError}</ErrorState>}
              </form>
            </div>
          </section>
          <AuthFooter />
        </>
      )}
    </AuthShell>
  );
}
