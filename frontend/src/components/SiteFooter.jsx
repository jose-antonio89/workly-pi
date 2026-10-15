export function FooterSection({ title, children, className = '', headingClassName = '' }) {
  return (
    <section className={`group min-w-0 ${className}`}>
      <h3
        className={`relative mb-[22px] w-fit text-[1.35rem] leading-[1.15] font-black text-[#0f172a] after:absolute after:-bottom-[9px] after:left-0 after:h-[3px] after:w-[42px] after:rounded-full after:bg-workly-primary after:transition-[width] after:content-[''] group-hover:after:w-full dark:text-workly-dark-text ${headingClassName}`}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

// Slots preserve page-owned copy and destinations without inventing URLs.
export default function SiteFooter({ children, bottom, catalog = false, lineHeight }) {
  return (
    <footer
      style={{ lineHeight }}
      className={`mt-16 w-full border-t border-[rgba(148,163,184,0.16)] bg-[radial-gradient(circle_at_15%_0%,rgba(4,191,85,0.08),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#f2f6fb_100%)] px-6 pt-14 pb-7 legacy-max-820:px-[22px] legacy-max-820:pt-11 legacy-max-820:pb-[26px] dark:border-[rgba(94,130,172,0.18)] dark:bg-[radial-gradient(circle_at_15%_0%,rgba(74,222,128,0.10),transparent_28%),linear-gradient(180deg,rgba(10,18,34,0.92),rgba(7,13,26,0.96))] ${catalog ? 'text-[#0f172a] dark:text-workly-dark-text' : 'text-[#5f718a] dark:text-[#a9b9cf]'}`}
    >
      <div className="mx-auto grid w-full max-w-[1180px] grid-cols-3 gap-[42px] legacy-max-820:grid-cols-1 legacy-max-820:gap-[34px]">
        {children}
      </div>
      {bottom && (
        <div className="mx-auto mt-[38px] w-full max-w-[1180px] border-t border-[rgba(148,163,184,0.16)] pt-[22px] text-center font-semibold text-[#7b8aa0] dark:text-[#a9b9cf]">
          {bottom}
        </div>
      )}
    </footer>
  );
}
