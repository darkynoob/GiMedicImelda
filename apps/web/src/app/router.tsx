import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../features/auth/components/LoginPage';
import { useAuth } from '../features/auth/hooks/auth-context';
import { DashboardPage } from '../features/dashboard/components/DashboardPage';
import { PatientDetailPage } from '../features/patients/components/PatientDetailPage';
import { NewPatientPage } from '../features/patients/components/NewPatientPage';
import { PatientsPage } from '../features/patients/components/PatientsPage';
import { ModulePlaceholderPage } from '../pages/ModulePlaceholderPage';

function ProtectedOutlet() {
  const { session, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div className="p-6 text-sm text-muted-foreground">Restaurando sesion...</div>;
  }

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}

const placeholder = (title: string, subtitle: string) => (
  <ModulePlaceholderPage subtitle={subtitle} title={title} />
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedOutlet />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <Navigate replace to="/" /> },
      { path: 'pacientes', element: <PatientsPage /> },
      { path: 'pacientes/nuevo', element: <NewPatientPage /> },
      { path: 'patients', element: <Navigate replace to="/pacientes" /> },
      { path: 'pacientes/:patientId', element: <PatientDetailPage /> },
      {
        path: 'patients/:patientId',
        element: <Navigate replace to="/pacientes" />,
      },
      {
        path: 'expedientes',
        element: placeholder('Expedientes', 'Vista homologada al proyecto de referencia.'),
      },
      {
        path: 'episodios',
        element: placeholder('Episodios', 'Vista homologada al proyecto de referencia.'),
      },
      {
        path: 'documentos',
        element: placeholder('Documentos', 'Vista homologada al proyecto de referencia.'),
      },
      {
        path: 'enfermeria',
        element: placeholder('Enfermeria', 'Vista homologada al proyecto de referencia.'),
      },
      {
        path: 'laboratorio',
        element: placeholder('Laboratorio', 'Vista homologada al proyecto de referencia.'),
      },
      {
        path: 'imagenologia',
        element: placeholder('Imagenologia', 'Vista homologada al proyecto de referencia.'),
      },
      {
        path: 'consentimientos',
        element: placeholder('Consentimientos', 'Vista homologada al proyecto de referencia.'),
      },
      {
        path: 'egresos',
        element: placeholder('Egresos', 'Vista homologada al proyecto de referencia.'),
      },
      {
        path: 'auditoria',
        element: placeholder('Auditoria', 'Vista homologada al proyecto de referencia.'),
      },
      {
        path: 'administracion',
        element: placeholder('Administracion', 'Vista homologada al proyecto de referencia.'),
      },
    ],
  },
]);
