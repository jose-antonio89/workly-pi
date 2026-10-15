import { Outlet } from 'react-router';
import SiteHeader from '../components/SiteHeader';

export default function AppLayout() {
  const dark = localStorage.getItem('darkMode') === 'enabled';
  return (
    <div
      data-workly-theme={dark ? 'dark' : 'light'}
      className="flex min-h-screen flex-col bg-workly-paper font-workly text-workly-ink-warm dark:bg-workly-night dark:text-workly-dark-text"
    >
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 items-center px-10 py-16 legacy-max-720:px-6">
        <Outlet />
      </main>
    </div>
  );
}
