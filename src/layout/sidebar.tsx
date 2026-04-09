import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  CalendarDays,
  Sparkles,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@core/stores/auth-store';
import { useUiStore } from '@core/stores/ui-store';
import { useLogout } from '@core/hooks/use-auth';
import { formatInitials } from '@shared/utils/format-initials';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  route: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { label: 'Contacts', icon: Users, route: '/contacts' },
  { label: 'Companies', icon: Building2, route: '/companies' },
  { label: 'Deals', icon: Handshake, route: '/deals' },
  { label: 'Activities', icon: CalendarDays, route: '/activities' },
  { label: 'AI Assistant', icon: Sparkles, route: '/ai' },
  { label: 'Settings', icon: Settings, route: '/settings' },
  { label: 'Users', icon: ShieldCheck, route: '/admin', adminOnly: true },
];

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => navigate('/auth/login'),
    });
  }

  return (
    <aside
      className={cn(
        'hidden md:flex h-screen bg-white border-r border-sr-border flex-col transition-all duration-200 overflow-hidden',
        collapsed ? 'w-[72px]' : 'w-[var(--sr-sidebar-width)]',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 min-h-16">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="sr-gradient-bg w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0">
            S
          </span>
          {!collapsed && (
            <span className="text-xl font-bold text-sr-text whitespace-nowrap">
              Sunroom <span className="sr-gradient-text">CRM</span>
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="shrink-0 p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Gradient line */}
      <div className="h-[3px] sr-gradient-bg mx-4 rounded-full" />

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto flex flex-col gap-0.5">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'Admin') return null;

          const link = (
            <NavLink
              key={item.route}
              to={item.route}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  'text-gray-500 hover:bg-sr-cream hover:text-sr-primary',
                  isActive &&
                    'bg-sr-primary/8 text-sr-primary font-semibold',
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.route} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Footer / user info */}
      {user && (
        <div className="p-3 border-t border-sr-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-sr-primary text-white flex items-center justify-center font-semibold text-[13px] shrink-0">
              {formatInitials(user.name)}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <span className="block font-semibold text-[13px] text-sr-text truncate">
                    {user.name}
                  </span>
                  <span className="block text-[11px] text-gray-400 uppercase tracking-wide">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
