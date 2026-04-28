import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useBeltStore } from '@/store/useBeltStore';
import AIChatPanel from '@/components/ai/AIChatPanel';
import PLCNotificationToast from '@/components/ui/PLCNotificationToast';
import { usePLCState } from '@/api/hooks';
import { useEffect } from 'react';

/** Syncs backend PLC state → global Zustand store on every poll (1 s).
 *  Mounted in Layout so it runs on every page — not just PLCPage. */
function PLCStateSync() {
  const { data: plc } = usePLCState();
  const setPLCRunning = useBeltStore((s) => s.setPLCRunning);

  useEffect(() => {
    if (!plc) return;
    const running = plc.beltState === 'running' || plc.beltState === 'starting';
    setPLCRunning(running, running ? undefined : `PLC: ${plc.beltState}${plc.autoStopReason ? ' — ' + plc.autoStopReason : ''}`);
  }, [plc?.beltState, plc?.autoStopReason]);

  return null;
}

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
      <AIChatPanel />
      <PLCNotificationToast />
      <PLCStateSync />
    </div>
  );
}
