import { useState } from 'react';
import { ModuleButton } from '../ui/ModuleUI';
import ContractCard from './ContractCard';

export default function ContractSection({ items, received, ...props }) {
  const [open, setOpen] = useState(true),
    title = received ? 'Me contrataram' : 'Contratei';
  return (
    <section className="grid gap-3.5">
      <button
        type="button"
        data-contract-toggle={received ? 'recebidos' : 'contratados'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex text-[13.3333px] min-h-[84px] items-center gap-3.5 rounded-[24px] border border-[#e2e8f0]/90 bg-white/88 px-5 py-[18px] text-left shadow-[0_18px_46px_rgba(15,23,42,0.06)] hover:-translate-y-px hover:border-workly-primary/25 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-workly-primary/22 legacy-max-760:items-start legacy-max-760:gap-2.5 legacy-max-760:p-4 dark:border-[#94a3b8]/16 dark:bg-[#0f172a]/92"
      >
        <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-2xl bg-workly-primary/12 text-workly-primary">
          <i
            aria-hidden="true"
            className={`fas ${received ? 'fa-handshake' : 'fa-cart-shopping'}`}
          />
        </span>
        <span className="grid min-w-0 flex-1 gap-1">
          <strong className="text-[1.35rem] leading-[1.1] legacy-max-760:text-[1.1rem]">
            {title}
          </strong>
          <small className="text-[0.94rem] leading-[1.45] text-[#64748b] legacy-max-760:text-[0.86rem] dark:text-[#aebbd0]">
            {received
              ? 'Propostas e trabalhos recebidos dos seus clientes.'
              : 'Serviços comprados por você. Acompanhe propostas, entregas e avaliações.'}
          </small>
        </span>
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-workly-primary/12 font-extrabold text-workly-primary legacy-max-760:h-[34px] legacy-max-760:w-[34px]">
          {items.length}
        </span>
        <span
          aria-hidden="true"
          className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[#f1f5f9] text-[#64748b] transition-transform legacy-max-760:h-[34px] legacy-max-760:w-[34px] dark:bg-[#17233a] dark:text-[#d7e2f2] ${open ? '' : '-rotate-90'}`}
        >
          <i className="fas fa-chevron-down" />
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-[380ms] motion-reduce:transition-none ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        inert={!open ? true : undefined}
      >
        <div className="min-h-0 overflow-hidden">
          {items.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] items-start gap-[22px] legacy-max-760:grid-cols-1">
              {items.map((c) => (
                <ContractCard key={c.idContrato} contract={c} {...props} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#cbd5e1] bg-white/90 p-[26px] text-[#64748b] dark:bg-[#0f172a]/92 dark:text-[#aebbd0]">
              <p>
                {received
                  ? 'Você ainda não recebeu propostas ou contratações.'
                  : 'Você ainda não contratou nenhum serviço.'}
              </p>
              <ModuleButton
                to={received ? '/anuncio' : '/todos-servicos'}
                tone={received ? 'secondary' : 'primary'}
              >
                {received ? 'Publicar serviço' : 'Explorar serviços'}
              </ModuleButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
