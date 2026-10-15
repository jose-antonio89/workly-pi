import { ModuleButton, moduleInput } from '../ui/ModuleUI';

export default function ReviewForm({ contract, onReview }) {
  return (
    <form
      data-review={contract.idContrato}
      className="mt-3.5 grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        await onReview({
          contratoId: contract.idContrato,
          notaServico: fd.get('notaServico'),
          notaFreelancer: fd.get('notaFreelancer'),
          comentario: fd.get('comentario')
        });
      }}
    >
      {[
        ['notaServico', 'Nota do serviço'],
        ['notaFreelancer', 'Nota do freelancer']
      ].map(([name, label]) => (
        <div
          key={name}
          className="grid grid-cols-[1fr_120px] items-center gap-2.5 legacy-max-760:grid-cols-1"
        >
          <label htmlFor={name + contract.idContrato}>{label}</label>
          <input
            id={name + contract.idContrato}
            name={name}
            type="number"
            min="1"
            max="5"
            defaultValue="5"
            className={moduleInput}
          />
        </div>
      ))}
      <textarea
        name="comentario"
        aria-label="Comentário sobre a experiência"
        placeholder="Comentário sobre a experiência"
        className={`${moduleInput} min-h-[76px]`}
      />
      <ModuleButton type="submit">
        <i aria-hidden="true" className="fas fa-star" />
        Enviar avaliação
      </ModuleButton>
    </form>
  );
}
