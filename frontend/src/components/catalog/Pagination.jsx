import Button from '../ui/Button';

export default function Pagination({ pagination, onPage }) {
  if (!pagination || (pagination.totalPages <= 1 && pagination.page <= 1)) return null;
  const { page, totalPages } = pagination;
  return (
    <nav aria-label="Páginas de serviços" className="mt-10 flex flex-wrap items-center justify-center gap-4">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(Math.min(page - 1, totalPages))}>Anterior</Button>
      <span role="status" className="text-sm text-workly-muted-warm tabular-nums">{page > totalPages ? 'Esta página não está mais disponível' : `Página ${page} de ${totalPages}`}</span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Próxima</Button>
    </nav>
  );
}
