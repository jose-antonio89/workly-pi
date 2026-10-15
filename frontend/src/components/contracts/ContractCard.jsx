import { ModuleButton, moduleSurface } from '../ui/ModuleUI';
import {
  canReview,
  contractActions,
  contractFeedback,
  contractPrice,
  contractStatus,
  finalStatuses
} from '../../services/contractService';
import { defaultServiceImage } from '../../services/catalogService';
import ReviewForm from './ReviewForm';

const pill =
  'inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-[7px] text-[0.82rem] font-bold text-[#475569] dark:bg-[#17233a] dark:text-[#d7e2f2]';
export default function ContractCard({ contract: c, onAction, onReview }) {
  const other = c.papel === 'cliente' ? c.freelancer : c.cliente,
    [priceIcon, price] = contractPrice(c),
    feedback = contractFeedback(c);
  const statusColor = ['pendente', 'proposta_pendente'].includes(c.status)
    ? '!bg-[#fff7ed] !text-[#b45309] dark:!bg-[#f59e0b]/20 dark:!text-[#fbbf24]'
    : c.status === 'cancelado'
      ? '!bg-[#fee2e2] !text-[#dc2626]'
      : c.status === 'em_andamento'
        ? '!bg-[#dbeafe] !text-[#2563eb]'
        : '!bg-[#ecfdf5] !text-[#047857] dark:!bg-workly-primary/12 dark:!text-[#8df0b6]';
  return (
    <article
      data-contract-id={c.idContrato}
      className={`${moduleSurface} flex min-h-full flex-col`}
    >
      <img
        src={c.imagemServico || defaultServiceImage}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = defaultServiceImage;
        }}
        alt=""
        loading="lazy"
        className="h-[170px] w-full bg-[#0f172a] object-cover"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-3 legacy-max-760:grid">
          <h3 className="text-[1.15rem] leading-[1.35] font-bold">{c.nomeServico}</h3>
          <span className={`${pill} ${statusColor} shrink-0 text-[0.78rem]`}>
            {contractStatus(c.status)}
          </span>
        </div>
        <p className="mb-3.5 leading-[1.55] text-[#64748b] dark:text-[#aebbd0]">
          {String(c.descricaoServico || 'Contrato criado pela plataforma Workly.').slice(0, 115)}
        </p>
        <div className="my-3 flex flex-wrap gap-2">
          <span className={pill}>
            <i aria-hidden="true" className="fas fa-user" />
            {other?.nome || 'Usuário'}
          </span>
          <span className={pill}>
            <i aria-hidden="true" className="fas fa-id-badge" />
            {c.papel === 'cliente' ? 'Você contratou' : 'Você recebeu'}
          </span>
          <span
            className={`${pill} !bg-[#ecfdf5] !text-[#047857] dark:!bg-workly-primary/12 dark:!text-[#8df0b6]`}
          >
            <i aria-hidden="true" className={`fas ${priceIcon}`} />
            {price}
          </span>
          {c.tipoContratacao && c.tipoContratacao !== 'fixo' && (
            <span className={pill}>
              <i aria-hidden="true" className="fas fa-handshake" />
              {c.tipoContratacao === 'combinar' ? 'Valor a combinar' : 'Negociação'}
            </span>
          )}
        </div>
        {c.mensagem && (
          <div className="mt-3.5 mb-0.5 rounded-[14px] bg-workly-primary/8 px-3.5 py-3 leading-[1.55] text-[#475569] dark:bg-workly-primary/10 dark:text-[#cbd5e1]">
            <strong>Mensagem:</strong> {c.mensagem}
          </div>
        )}
        <div className="mt-4 grid gap-2.5">
          {c.idServico && (
            <ModuleButton to={`/detalhe-servico?id=${c.idServico}`} tone="secondary">
              Ver serviço
            </ModuleButton>
          )}
          {!finalStatuses.includes(c.status) && (
            <ModuleButton to={`/mensagens?contrato=${c.idContrato}`} tone="secondary">
              <i aria-hidden="true" className="fas fa-comments" />
              Chat
            </ModuleButton>
          )}
          {contractActions(c).map(([action, label]) => (
            <ModuleButton
              key={action}
              data-action={action}
              tone={['cancelar', 'recusar'].includes(action) ? 'danger' : 'primary'}
              onClick={() => onAction(c.idContrato, action)}
            >
              <i
                aria-hidden="true"
                className={`fas ${['cancelar', 'recusar'].includes(action) ? 'fa-xmark' : action === 'iniciar' || c.status === 'pendente' ? 'fa-play' : 'fa-check'}`}
              />
              {label}
            </ModuleButton>
          ))}
          {canReview(c) ? (
            <ReviewForm contract={c} onReview={onReview} />
          ) : (
            feedback && (
              <div
                className={`mt-3 flex gap-2 rounded-[14px] px-3.5 py-3 font-extrabold ${feedback[2] ? 'bg-[#ecfdf5] text-[#047857] dark:bg-workly-primary/12 dark:text-[#8df0b6]' : 'bg-[#fff7ed] text-[#b45309]'}`}
              >
                <i aria-hidden="true" className={`fas ${feedback[0]}`} />
                {feedback[1]}
              </div>
            )
          )}
        </div>
      </div>
    </article>
  );
}
