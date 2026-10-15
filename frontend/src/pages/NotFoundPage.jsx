import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <section className="w-full min-w-0 border-t-2 border-workly-forest pt-8 dark:border-workly-dark-accent/60" aria-labelledby="not-found-title">
      <p className="mb-4 font-workly-display text-[5rem] leading-none font-semibold text-workly-forest tabular-nums [font-variation-settings:'opsz'_96] dark:text-workly-dark-accent">
        404
      </p>
      <h1
        id="not-found-title"
        className="mb-3 font-workly-display text-[clamp(2rem,4vw,3rem)] leading-tight font-semibold tracking-[-0.02em] [font-variation-settings:'opsz'_96]"
      >
        Página não encontrada
      </h1>
      <p className="mb-8 max-w-[48ch] text-lg leading-relaxed text-workly-muted-warm dark:text-[#9aa59f]">
        O endereço pode ter mudado ou não existe mais. Volte ao início ou explore os serviços.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button to="/">Ir para o início</Button>
        <Button to="/todos-servicos" variant="secondary">
          Ver serviços
        </Button>
      </div>
    </section>
  );
}
