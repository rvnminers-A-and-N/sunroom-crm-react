import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[260px] bg-white border-r border-sr-border p-4 hidden md:block">
        <p className="font-bold text-sr-primary">Sunroom CRM</p>
        <p className="text-sm text-gray-400 mt-2">Sidebar placeholder</p>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
