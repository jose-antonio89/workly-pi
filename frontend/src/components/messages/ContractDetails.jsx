import { useEffect, useRef } from 'react';
import { serviceImage } from '../home/offices';
import { Link } from 'react-router';
import Button from '../ui/Button';
import { ModuleButton } from '../ui/ModuleUI';
import { contractPrice, contractStatus } from '../../services/contractService';
import { defaultServiceImage } from '../../services/catalogService';
import { otherUser, publicProfileUrl } from '../../services/messageService';

export default function ContractDetails({ contract: c, onClose }) {
  const close = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    close.current?.focus();
    const escape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('keydown', escape);
      previous?.focus();
    };
  }, [onClose]);
  const other = otherUser(c),
    rows = [
      [
        'Conversa com',
        <Link
          to={publicProfileUrl(other)}
          className="font-bold text-workly-primary-ink hover:underline"
        >
          {other.nome || 'Usuário'}
        </Link>
      ],
      ['Seu papel', c.papel === 'cliente' ? 'Contratante' : 'Freelancer'],
      [
        'Tipo',
        c.tipoContratacao === 'fixo'
          ? 'Preço fixo'
          : c.tipoContratacao === 'combinar'
            ? 'Valor a combinar'
            : 'Negociação'
      ],
      ['Valor', contractPrice(c)[1]],
      ['Prazo desejado', c.prazoDesejado || c.prazo_desejado || 'Não informado'],
      [
        'Referências',
        c.referencias ? (
          <a
            href={c.referencias}
            target="_blank"
            rel="noopener noreferrer"
            className="text-workly-primary-ink"
          >
            {c.referencias}
          </a>
        ) : (
          'Não informado'
        )
      ]
    ];
  return (
    <div
      id="contractDetailsModal"
      className="fixed inset-0 z-[30000] flex items-center justify-center p-[22px]"
    >
      <div onClick={onClose} className="absolute inset-0 bg-[#040a14]/52 backdrop-blur-lg" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="contractDetailTitle"
        className="relative max-h-[calc(100vh-44px)] w-full max-w-[760px] overflow-auto rounded-lg border border-[#8a938d]/18 bg-workly-card shadow-[0_1px_2px_rgba(22,33,27,0.05)] dark:border-[#3a4741]/20 dark:bg-[#16211b]/88"
      >
        <header className="flex justify-between gap-3.5 border-b border-[#8a938d]/16 px-6 py-[22px]">
          <div>
            <span className="sr-only">
              <i aria-hidden="true" className="fas fa-file-contract" />
              Detalhes
            </span>
            <h2
              id="contractDetailTitle"
              className="mt-2 text-[1.65rem] font-bold text-workly-ink-warm dark:text-[#ecebe5]"
            >
              {c.nomeServico || 'Contrato'}
            </h2>
          </div>
          <Button
            appearance="custom"
            ref={close}
            onClick={onClose}
            title="Fechar detalhes"
            aria-label="Fechar detalhes"
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-workly-sunken text-workly-ink-warm/80 focus-visible:outline-2 focus-visible:outline-workly-primary"
          >
            <i aria-hidden="true" className="fas fa-xmark" />
          </Button>
        </header>
        <div id="contractDetailContent" className="px-6 pt-[22px] pb-6">
          <div className="mb-[18px] grid grid-cols-[180px_minmax(0,1fr)] items-center gap-[18px] legacy-max-640:grid-cols-1">
            <img
              src={serviceImage(c, defaultServiceImage)}
              alt=""
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = defaultServiceImage;
              }}
              className="h-[124px] w-full rounded-lg object-cover"
            />
            <div>
              <span className="rounded-full bg-workly-sunken px-2.5 py-[7px] text-[0.82rem] font-semibold dark:bg-[#1a2621]">
                {contractStatus(c.status)}
              </span>
              <h3 className="mt-3 mb-2 text-[1.35rem] leading-[1.2] font-bold text-workly-ink-warm dark:text-[#ecebe5]">
                {c.nomeServico || 'Serviço'}
              </h3>
              <p className="leading-[1.55] font-semibold text-workly-muted-warm dark:text-[#9aa59f]">
                {c.descricaoServico || 'Contrato criado pela plataforma Workly.'}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2.5 legacy-max-640:grid-cols-1">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-lg border border-[#8a938d]/14 bg-workly-paper px-3.5 py-[13px] dark:border-[#3a4741]/20 dark:bg-[#16211b]/88"
              >
                <dt className="mb-[5px] text-[0.74rem] font-bold text-workly-muted-warm uppercase">
                  {label}
                </dt>
                <dd className="font-semibold text-workly-ink-warm [overflow-wrap:anywhere] dark:text-[#ecebe5]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-[18px] flex flex-wrap gap-2.5">
            {c.idServico && (
              <ModuleButton to={`/detalhe-servico?id=${c.idServico}`} tone="secondary">
                <i aria-hidden="true" className="fas fa-eye" />
                Ver serviço
              </ModuleButton>
            )}
            <ModuleButton to="/contratos" tone="secondary">
              <i aria-hidden="true" className="fas fa-briefcase" />
              Ver contratos
            </ModuleButton>
          </div>
        </div>
      </section>
    </div>
  );
}
