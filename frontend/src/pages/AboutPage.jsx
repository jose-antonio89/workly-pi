import { useEffect, useRef } from 'react';
import CatalogShell from '../components/catalog/CatalogShell';

const members = [
  {
    name: 'Cauã',
    role: 'Desenvolvedor',
    image: '20250404_083557.jpg',
    text: 'Tenho 20 anos, estudo na FATEC desde 2023 e atualmente curso Desenvolvimento de Software Multiplataforma. Atuo como desenvolvedor principal da Workly.',
    href: 'https://github.com/CauaMora'
  },
  {
    name: 'José',
    role: 'Design / Figma',
    image: 'Screenshot_4.png',
    text: 'Sou estudante da FATEC Jaú no curso de Desenvolvimento de Software Multiplataforma e ajudo a Workly principalmente na parte de identidade visual e design da experiência.',
    href: 'https://github.com/jose-antonio89'
  },
  {
    name: 'Luiz',
    role: 'Documentação',
    image: 'IMG-20250615-WA0008.jpg',
    text: 'Tenho 18 anos e curso Desenvolvimento de Software Multiplataforma na FATEC Jaú, contribuindo com a organização e documentação do projeto.',
    href: '#'
  }
];

export default function AboutPage() {
  const container = useRef(null);
  useEffect(() => {
    const reveal = () =>
      container.current?.querySelectorAll('[data-team-member]').forEach((member) => {
        const rect = member.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0) member.dataset.visible = 'true';
      });
    window.addEventListener('scroll', reveal);
    reveal();
    return () => window.removeEventListener('scroll', reveal);
  }, []);
  return (
    <CatalogShell title="Sobre Nós" showCategories={false}>
      <main
        ref={container}
        className="mx-auto my-14 max-w-[1180px] px-6 text-center leading-[1.6] dark:my-12"
      >
        <h1 className="mt-[.67em] mb-3 text-[3.4rem] font-bold text-[#0f172a] legacy-max-860:text-[2.2rem] dark:text-workly-dark-accent">
          Conheça nossa equipe
        </h1>
        <p className="mx-auto mb-11 max-w-[760px] text-[1.02rem] text-[#64748b] dark:text-[#9fb0c7]">
          A Workly nasceu para conectar empresas e freelancers de forma simples, rápida e
          profissional. Esse é o time por trás do projeto.
        </p>
        {members.map((member, index) => (
          <section
            key={member.name}
            data-team-member
            data-visible="false"
            className={`mb-7 grid translate-y-6 grid-cols-[180px_minmax(0,1fr)] items-center gap-7 text-left opacity-0 transition-[opacity,transform] duration-[550ms] ease-[ease] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 dark:items-stretch dark:gap-6 legacy-max-860:grid-cols-1 legacy-max-860:text-center ${index === 1 ? 'min-[861px]:grid-cols-[minmax(0,1fr)_180px]' : ''}`}
          >
            <div className={`flex justify-center ${index === 1 ? 'min-[861px]:order-2' : ''}`}>
              <img
                loading="lazy"
                decoding="async"
                src={`/assets/img/${member.image}`}
                alt={`Foto do ${member.name}`}
                className="size-[170px] rounded-[50%] border-4 border-[rgba(15,23,42,.06)] object-cover shadow-[0_14px_30px_rgba(15,23,42,.10)] dark:border-white/[.08] dark:shadow-[0_10px_26px_rgba(0,0,0,.22)]"
              />
            </div>
            <div className="py-5">
              <h2 className="mb-1.5 text-[1.6rem] font-bold text-workly-primary dark:text-workly-dark-accent">
                {member.name}
              </h2>
              <h3 className="mb-[14px] text-[1.17rem] font-medium text-[#64748b] dark:text-[#9fb0c7]">
                {member.role}
              </h3>
              <p className="mb-4 text-[#4b5563] dark:text-[#9fb0c7]">{member.text}</p>
              <a
                href={member.href}
                target={member.href === '#' ? undefined : '_blank'}
                rel={member.href === '#' ? undefined : 'noopener noreferrer'}
                className="inline-flex items-center gap-2 font-semibold text-workly-primary hover:text-[#039447] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-workly-primary dark:text-[#9fb0c7] dark:hover:text-[#86efac]"
              >
                <i
                  aria-hidden="true"
                  className={
                    member.href === '#' ? 'fa-regular fa-file-lines' : 'fa-brands fa-github'
                  }
                />
                {member.href === '#' ? 'Em breve' : 'GitHub'}
              </a>
            </div>
          </section>
        ))}
      </main>
    </CatalogShell>
  );
}
