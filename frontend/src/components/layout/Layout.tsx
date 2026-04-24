import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useBeltStore } from '@/store/useBeltStore';
import AIChatPanel from '@/components/ai/AIChatPanel';

export default function Layout() {
  const sidebarOpen = useBeltStore((s) => s.sidebarOpen);

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <Sidebar />
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      {/* Global AI chat — available on every page */}
      <AIChatPanel />
    </div>
  );
}
