import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <section className="w-full min-w-0" aria-labelledby="not-found-title">
      <p className="mb-3 text-sm font-semibold">404</p>
      <h1 id="not-found-title" className="mb-4 text-2xl leading-tight font-semibold sm:text-3xl">
        Página não encontrada
      </h1>
      <p className="mb-6 text-base leading-relaxed">
        A página que você procura não está disponível.
      </p>
      <Button to="/">Ir para o início</Button>
    </section>
  );
}
