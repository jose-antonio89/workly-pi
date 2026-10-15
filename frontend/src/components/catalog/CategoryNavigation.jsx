import { Link } from 'react-router';
import { categories } from '../../services/catalogService';

export default function CategoryNavigation({ active }) {
  return (
    <div className="w-full overflow-hidden border-b border-[rgba(15,23,42,0.08)] bg-[rgba(248,251,255,0.96)] shadow-[0_10px_24px_rgba(15,23,42,0.03)] dark:border-[rgba(94,130,172,0.16)] dark:bg-[rgba(10,18,34,0.98)]">
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1520px] items-center justify-between gap-4 px-8 legacy-max-1100:justify-start legacy-max-1100:overflow-x-auto legacy-max-1100:[scrollbar-width:none] legacy-max-720:min-h-[58px] legacy-max-720:gap-2.5 legacy-max-720:px-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/categorias?id=${category.id}`}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-[9px] rounded-full border px-4 text-[0.94rem] font-extrabold whitespace-nowrap hover:-translate-y-px hover:border-workly-primary-glow/[0.22] hover:bg-workly-primary-glow/10 hover:text-[#0f9f54] legacy-max-720:min-h-[38px] legacy-max-720:px-[13px] legacy-max-720:text-[0.84rem] dark:hover:border-workly-dark-accent/25 dark:hover:bg-workly-dark-accent/[0.13] dark:hover:text-workly-dark-accent ${active === category.id ? 'border-workly-primary-glow/[0.22] bg-workly-primary-glow/10 text-[#0f9f54] dark:border-workly-dark-accent/25 dark:bg-workly-dark-accent/[0.13] dark:text-workly-dark-accent' : 'border-transparent text-[#0f172a] dark:text-[#eef5ff]'}`}
          >
            <i aria-hidden="true" className={`fas ${category.icon} text-[0.98rem]`} />
            <span>{category.navName || category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
