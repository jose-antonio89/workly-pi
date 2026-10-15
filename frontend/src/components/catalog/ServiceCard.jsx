import { Link, useNavigate } from 'react-router';
import {
  defaultServiceImage,
  defaultProfileImage,
  formatCurrency,
  serviceRating,
  serviceDate,
  isNewToday
} from '../../services/catalogService';

export default function ServiceCard({ service, featured = false, owner = false }) {
  const navigate = useNavigate();
  const detail = `/detalhe-servico?id=${service.idServico}`;
  const image = service.imagemServico || defaultServiceImage;
  const meta =
    'inline-flex min-h-[25px] items-center gap-[5px] rounded-[7px] px-[9px] py-[7px] text-[0.75rem] leading-none font-[850] dark:bg-[rgba(148,163,184,0.12)] dark:text-[#dbeafe]';
  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={service.nome}
      onClick={() => navigate(detail)}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && event.key === 'Enter') navigate(detail);
      }}
      className={`group flex w-full min-w-0 gap-[14px] p-[14px] cursor-pointer flex-col overflow-hidden rounded-xl border border-[rgba(148,163,184,0.20)] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.055)] transition-[transform,box-shadow,border-color] duration-[180ms] hover:-translate-y-0.5 hover:border-workly-primary/[0.28] hover:shadow-[0_16px_34px_rgba(15,23,42,0.105)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-workly-primary dark:border-[rgba(94,130,172,0.18)] dark:bg-transparent dark:bg-[linear-gradient(160deg,rgba(14,25,42,0.96),rgba(12,20,36,0.92))] dark:shadow-[0_20px_56px_rgba(0,4,18,0.38)] dark:hover:border-workly-dark-accent/25 dark:hover:shadow-[0_26px_66px_rgba(0,4,18,0.50)] max-w-[360px] legacy-max-480:max-w-full dark:rounded-3xl`}
    >
      <div
        className={`relative w-full min-h-[150px] max-h-[190px] legacy-max-768:min-h-[145px] legacy-max-768:max-h-[180px] aspect-video rounded-[18px] overflow-hidden bg-[linear-gradient(135deg,#071827,#0d3a2d)] ${featured ? 'h-[168px]' : 'h-44 legacy-max-720:h-[158px]'}`}
      >
        <img
          src={image}
          alt="Imagem do serviço"
          loading="lazy"
          decoding="async"
          className={`block h-full w-full object-center ${image.includes('servico_padrao.svg') ? 'object-contain px-[34px] py-6' : 'object-cover transition-transform duration-[240ms] group-hover:scale-[1.025] group-hover:saturate-[1.03]'}`}
          onError={(event) => {
            const element = event.currentTarget;
            if (element.src !== new URL(defaultServiceImage, location.origin).href) {
              element.src = defaultServiceImage;
              element.classList.remove('object-cover');
              element.classList.add('object-contain', 'px-[34px]', 'py-6');
            }
          }}
        />
        <span className="absolute top-2.5 left-2.5 max-w-[calc(100%-20px)] truncate rounded-[7px] bg-white/94 px-2.5 py-1.5 text-[0.68rem] font-black text-[#047a3b] uppercase shadow-[0_7px_16px_rgba(15,23,42,0.10)] backdrop-blur-[10px] dark:border dark:border-workly-dark-accent/[0.16] dark:bg-[rgba(10,18,34,0.86)] dark:text-[#86efac]">
          {service.nomeCategoria}
        </span>
      </div>
      <div className={`flex flex-1 flex-col gap-2.5 px-[14px] pt-[14px] pb-[15px] min-h-0`}>
        <div className="mb-[11px] grid grid-cols-[30px_minmax(0,1fr)] items-center gap-[9px]">
          <img
            src={service.fotoPerfil || defaultProfileImage}
            alt={`Foto de ${service.nomeFreelancer}`}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              if (event.currentTarget.src !== new URL(defaultProfileImage, location.origin).href)
                event.currentTarget.src = defaultProfileImage;
            }}
            className="h-[38px] w-[38px] min-w-[38px] rounded-full border-2 border-white bg-[linear-gradient(135deg,#122033,#1a2f4b)] object-cover shadow-[0_5px_12px_rgba(15,23,42,0.11)] dark:border-[rgba(238,244,255,0.12)]"
          />
          <Link
            to={`/perfil-publico?id=${service.idUsuario}`}
            onClick={(event) => event.stopPropagation()}
            className="truncate text-[0.88rem] leading-[1.1] font-[850] text-[#334155] hover:text-workly-primary hover:underline dark:text-[#dbeafe]"
          >
            {service.nomeFreelancer}
          </Link>
        </div>
        <h3 className="m-0 line-clamp-2 text-[1.18rem] leading-[1.25] font-extrabold text-[#0f172a] dark:text-[#f8fafc]">
          {service.nome}
        </h3>
        <p className="m-0 line-clamp-2 min-h-[42px] text-[0.95rem] leading-[1.45] font-medium text-[#475569] dark:text-[#cbd5e1]">
          {service.descricao}
        </p>
        <div className="mt-0.5 mb-0 flex flex-wrap items-center gap-[7px]">
          <span
            className={`${meta} bg-[rgba(245,158,11,0.12)] text-[#9a5b00] dark:bg-[rgba(245,158,11,0.16)] dark:text-[#fde68a]`}
          >
            <i aria-hidden="true" className="fas fa-star text-workly-primary" />
            {serviceRating(service)}
          </span>
          <span className={`${meta} bg-[#eef3f8] text-[#64748b]`}>
            <i aria-hidden="true" className="far fa-calendar-alt text-workly-primary" />
            {serviceDate(service)}
          </span>
          {isNewToday(service) && (
            <span className={`${meta} bg-workly-primary/10 text-[#64748b]`}>Novo</span>
          )}
        </div>
        <div className="mt-auto grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto] items-end gap-3 pt-0.5 legacy-max-720:grid-cols-1">
          <div className="min-w-0 self-end">
            <small className="mb-0.5 block text-[0.67rem] font-black text-[#7b8aa0] uppercase dark:text-[#a9b9cf]">
              Valor
            </small>
            <strong className="block max-w-full text-[1.04rem] leading-[1.12] font-black break-words text-workly-primary">
              {service.valorCombinar ? 'Valor a combinar' : formatCurrency(service.preco)}
            </strong>
          </div>
          {owner && (
            <Link
              to={`/editar-servico?id=${service.idServico}`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-workly-primary px-4 py-2 font-bold text-white focus-visible:outline-2 focus-visible:outline-workly-primary"
            >
              <i aria-hidden="true" className="fas fa-pen" />
              Alterar
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
