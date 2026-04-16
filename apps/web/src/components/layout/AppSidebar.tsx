import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  FolderOpen,
  LayoutDashboard,
  LogOut as LogOutIcon,
  ScanLine,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navSections = [
  {
    label: 'Principal',
    items: [
      { title: 'Inicio', icon: LayoutDashboard, path: '/' },
      { title: 'Pacientes', icon: Users, path: '/pacientes' },
      { title: 'Expedientes', icon: FolderOpen, path: '/expedientes' },
      { title: 'Episodios', icon: Calendar, path: '/episodios' },
      { title: 'Documentos', icon: FileText, path: '/documentos' },
    ],
  },
  {
    label: 'Clinico',
    items: [
      { title: 'Enfermeria', icon: Activity, path: '/enfermeria' },
      { title: 'Laboratorio', icon: FlaskConical, path: '/laboratorio' },
      { title: 'Imagenologia', icon: ScanLine, path: '/imagenologia' },
      { title: 'Consentimientos', icon: ClipboardList, path: '/consentimientos' },
      { title: 'Egresos', icon: LogOutIcon, path: '/egresos' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { title: 'Auditoria', icon: ShieldCheck, path: '/auditoria', hidden: true, roles: ['Administrador del Tenant'] },
      { title: 'Administracion', icon: Settings, path: '/administracion' },
    ],
  },
];

import { useAuth } from '../../features/auth/hooks/auth-context';

type Props = {
  isOpen: boolean; // mobile
};

export function AppSidebar({ isOpen }: Props) {
  const [collapsed, setCollapsed] = useState(false); // desktop
  const location = useLocation();
  const { session } = useAuth();
  const userRole = session?.user.roles[0]?.name ?? '';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300',
        
        // Desktop
        'md:sticky md:translate-x-0 md:z-30 md:h-screen md:border-r md:border-sidebar-border',
        collapsed ? 'md:w-16' : 'md:w-60',

        // Mobile behavior
        isOpen ? 'translate-x-0 w-60' : '-translate-x-full w-60'
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Stethoscope className="h-6 w-6 shrink-0 text-clinical-info" />
        {!collapsed ? (
          <span className="ml-2.5 text-lg font-semibold tracking-tight text-sidebar-primary">
            giMedic
          </span>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navSections.map((section) => (
          <div className="mb-4" key={section.label}>
            {!collapsed ? (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {section.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.filter((item) => {
                  if (item.hidden) return false
                  if (item.roles && !item.roles.includes(userRole)) return false
                  return true
                }).map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                  <li key={item.path}>
                    <NavLink
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                      )}
                      to={item.path}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? <span>{item.title}</span> : null}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        className="flex h-10 items-center justify-center border-t border-sidebar-border text-sidebar-muted transition-colors hover:text-sidebar-foreground"
        onClick={() => setCollapsed((value) => !value)}
        type="button"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
