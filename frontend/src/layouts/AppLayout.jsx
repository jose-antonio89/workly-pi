import { Outlet } from 'react-router';
import SiteHeader from '../components/SiteHeader';

export default function AppLayout() {
  const dark = localStorage.getItem('darkMode') === 'enabled';
  return (
    <div
      data-workly-theme={dark ? 'dark' : 'light'}
      className="flex min-h-screen flex-col bg-workly-background font-workly text-workly-text dark:bg-workly-dark-background dark:text-workly-dark-text"
    >
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1180px] flex-1 items-center px-5 py-12 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
