import SiteFooter, { FooterSection } from '../SiteFooter';

const link =
  'inline-flex w-fit items-center font-[650] transition-transform hover:translate-x-1 hover:text-workly-primary dark:hover:text-[#86efac]';
const section = 'mb-[30px] w-[300px] max-w-full';
export default function AuthFooter({
  catalog = false,
  detail = false,
  about = false,
  compact = false
}) {
  const sectionStyle = catalog ? (detail || about || compact ? '' : 'mb-[30px]') : section;
  const headingStyle = catalog && (detail || about || compact) ? '' : 'pb-2.5';
  return (
    <SiteFooter
      catalog={catalog}
      lineHeight={about ? 1.6 : undefined}
      bottom="© 2025 Workly. Todos os direitos reservados."
    >
      <FooterSection
        title="Sobre a Workly"
        className={sectionStyle}
        headingClassName={headingStyle}
      >
        <p className="max-w-[310px] leading-[1.7] font-medium">
          Conectando empresas aos melhores freelancers desde 2025.
        </p>
      </FooterSection>
      <FooterSection title="Links Rápidos" className={sectionStyle} headingClassName={headingStyle}>
        <ul className="grid gap-3">
          {['Termos de Serviço', 'Política de Privacidade', 'Contato'].map((text) => (
            <li key={text}>
              <a href="#" className={link}>
                {text}
              </a>
            </li>
          ))}
        </ul>
      </FooterSection>
      <FooterSection title="Redes Sociais" className={sectionStyle} headingClassName={headingStyle}>
        <div className="flex items-center gap-[14px]">
          {['facebook', 'twitter', 'instagram', 'linkedin'].map((icon) => (
            <a
              key={icon}
              href="#"
              aria-label={icon}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(148,163,184,0.14)] bg-[#e9eef5] text-[1.2rem] text-[#64748b] hover:-translate-y-1 hover:bg-workly-primary hover:text-white dark:bg-[rgba(148,163,184,0.12)] dark:text-[#dbeafe] dark:hover:bg-[rgba(74,222,128,0.18)] dark:hover:text-[#86efac]"
            >
              <i aria-hidden="true" className={`fab fa-${icon}`} />
            </a>
          ))}
        </div>
      </FooterSection>
    </SiteFooter>
  );
}
