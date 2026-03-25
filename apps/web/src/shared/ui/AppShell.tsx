import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/auth-context';

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/patients', label: 'Pacientes' },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { session, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand-mark" to="/dashboard">
          <span>GM</span>
          <div>
            <strong>giMedic</strong>
            <small>Clinical operations</small>
          </div>
        </Link>

        <nav className="nav-list">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive ? 'nav-item active' : 'nav-item'
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>{session?.user.fullName}</strong>
          <span>{session?.user.tenant.name}</span>
          <button className="ghost-button" onClick={logout} type="button">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="main-panel">
        <header className="page-header">
          <div>
            <span className="eyebrow">Operación clínica</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
