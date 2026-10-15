import { defaultProfileImage } from '../../services/catalogService';

export const panel =
  'min-w-0 rounded-[15px] border border-[rgba(148,163,184,0.18)] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:border-[rgba(94,130,172,0.18)] dark:bg-transparent dark:bg-[linear-gradient(160deg,rgba(14,25,42,0.94),rgba(12,20,36,0.90))] dark:rounded-3xl dark:text-[#edf3fe]';
export const emptyPanel =
  'rounded-[18px] border border-[rgba(148,163,184,0.18)] bg-[#f8fafc] p-6 text-center text-[#64748b] dark:bg-[rgba(15,23,42,0.55)] dark:text-[#a9b9cf]';
export function Stars({ value, round = false }) {
  const rating = round ? Math.round(Number(value || 0)) : Number(value || 0);
  return (
    <span className="inline-flex gap-1 text-[#f59e0b]" aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} aria-hidden="true" className={`${rating >= i + 1 ? 'fas' : 'far'} fa-star`} />
      ))}
    </span>
  );
}
export default function ProfileHeader({
  user,
  services = [],
  summary = {},
  publicProfile = false,
  onPhoto
}) {
  const contractor =
    String(user.tipoConta || '')
      .toLowerCase()
      .includes('contratante') && !services.length;
  const created = user.createdAt && new Date(user.createdAt);
  const since =
    created && !Number.isNaN(created.getTime())
      ? created.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : '--';
  const stats = publicProfile
    ? [
        [services.length, 'Serviços'],
        [
          summary.total
            ? Number(summary.mediaFreelancer || 0)
                .toFixed(1)
                .replace('.', ',')
            : '--',
          'Avaliação'
        ],
        [user.tipoConta || '--', 'Tipo']
      ]
    : [
        [services.length, 'Serviços'],
        [user.tipoConta || '--', 'Tipo de conta'],
        [user.areaAtuacao || '--', 'Área']
      ];
  return (
    <section
      className={`relative flex flex-wrap items-stretch gap-[30px] overflow-hidden rounded-[15px] bg-white p-[30px] shadow-[0_12px_36px_rgba(15,23,42,0.08)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_12%_20%,rgba(4,191,85,0.12),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(33,150,243,0.08),transparent_32%)] [&>div]:relative [&>div]:z-[1] legacy-max-768:flex-col legacy-max-768:p-5 legacy-max-768:text-center legacy-max-600:justify-center dark:bg-transparent dark:border dark:border-[rgba(148,163,184,0.10)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] dark:bg-[linear-gradient(135deg,rgba(8,18,31,0.96),rgba(15,23,42,0.92))] ${publicProfile ? 'mb-6' : 'mb-10'}`}
    >
      <div className="relative h-[150px] w-[150px] shrink-0">
        <img
          id={publicProfile ? 'publicAvatar' : undefined}
          className="h-[150px] w-[150px] rounded-full border-[5px] border-workly-primary dark:border-[rgba(94,130,172,.20)] object-cover"
          src={user.fotoPerfil || defaultProfileImage}
          alt="Foto de perfil"
        />
        {onPhoto && (
          <button
            type="button"
            aria-label="Alterar foto de perfil"
            onClick={onPhoto}
            className="absolute right-1.5 bottom-2 grid h-[42px] w-[42px] border-[3px] border-white text-[13.3333px] shadow-[0_8px_18px_rgba(0,0,0,.18)] place-items-center rounded-full bg-workly-primary text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-workly-primary"
          >
            <i className="fas fa-camera" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="min-w-[280px] flex-1">
        <h1
          id={publicProfile ? 'publicName' : undefined}
          className={`mb-[5px] text-[2rem] font-bold break-words text-[#111827] dark:text-[#f8fafc]`}
        >
          {user.nome || 'Usuário Workly'}
        </h1>
        <p className="mb-2 text-[1.2rem] font-semibold text-[#9e9e9e] dark:text-[#8fa3c4]">
          {user.tituloProfissional ||
            `${user.tipoConta || 'Usuário'}${user.areaAtuacao ? ' • ' + user.areaAtuacao : ''}`}
        </p>
        <p className="mt-1.5 mb-[14px] max-w-[680px] text-[0.95rem] leading-[1.6] text-[#64748b] legacy-max-768:mx-auto dark:text-[#8fa3c4]">
          {user.bio ||
            (publicProfile
              ? contractor
                ? 'Contratante da plataforma Workly.'
                : 'Este usuário ainda não adicionou uma biografia.'
              : 'Adicione uma biografia nas configurações para contar um pouco sobre seus serviços e experiência.')}
        </p>
        {!publicProfile && (
          <p className="inline-flex items-center gap-2 text-[#777] dark:text-[#94a3b8]">
            <i aria-hidden="true" className="fas fa-calendar text-workly-primary" />
            Workly desde {since.charAt(0).toUpperCase() + since.slice(1)}
          </p>
        )}
        <div className="mt-5 flex items-stretch gap-5 legacy-max-768:flex-wrap legacy-max-768:justify-center">
          {stats.map(([value, label]) => (
            <div
              key={label}
              className="min-w-[150px] rounded-[10px] border border-workly-primary/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(245,247,250,0.86))] px-[22px] py-[18px] text-left shadow-[0_12px_28px_rgba(15,23,42,0.08)] legacy-max-768:w-[calc(50%-10px)] legacy-max-768:text-center dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_16px_34px_rgba(0,0,0,0.22)] dark:border-[#22c55e]/16 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.58))]"
            >
              <strong className="block text-[1.5rem] font-bold whitespace-nowrap text-workly-primary dark:text-[#22c55e]">
                {value}
              </strong>
              <span className="mt-1 block text-[0.9rem] text-[#333] dark:text-[#cbd5e1]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
