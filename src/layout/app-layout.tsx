import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { MobileSidebar } from './mobile-sidebar';
import { Toolbar } from './toolbar';
import { useCurrentUser } from '@core/hooks/use-auth';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  useCurrentUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Toolbar onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 max-w-[1280px] w-full mx-auto max-md:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
