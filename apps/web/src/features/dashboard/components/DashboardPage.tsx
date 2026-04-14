import { ArrowRight, Clock, FileText, TrendingUp, Users, Activity, Calendar, ClipboardCheck, AlertTriangle, FolderOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { fetchDashboardSummary } from '../api/dashboard.service';
import { useAuth } from '../../auth/hooks/auth-context';
import { formatDateTime } from '../../../shared/lib/formatters';

const pendingDocs: Array<{ title: string; patient: string | null; type: string | null; status: string | null; time: string | null }> = [];
const auditRecent: Array<{ action: string; user: string | null; entity: string | null; time: string | null }> = [];
const clinicalAlerts: Array<{ title: string; body: string; variant: 'alert' | 'warning' | 'info' }> = [];

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'OPEN' ? 'success' : status === 'CLOSED' ? 'secondary' : 'warning';
  return <Badge variant={variant}>{status}</Badge>;
}

function DocStatusBadge({ status }: { status: string }) {
  const variant = status === 'Listo para firma' ? 'warning' : 'draft';
  return <Badge variant={variant}>{status}</Badge>;
}

export function DashboardPage() {
  const { session } = useAuth();
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => fetchDashboardSummary(session!.accessToken),
    enabled: Boolean(session),
  });

  const metrics = summaryQuery.data?.metrics.map((metric) => ({
    ...metric,
    icon:
      metric.label === 'Pacientes activos'
        ? Users
        : metric.label === 'Expedientes activos'
          ? FolderOpen
          : Calendar,
    color:
      metric.label === 'Pacientes activos'
        ? 'bg-clinical-info/10 text-clinical-info'
        : metric.label === 'Expedientes activos'
          ? 'bg-clinical-success/10 text-clinical-success'
          : 'bg-clinical-warning-foreground/10 text-clinical-warning-foreground',
  })) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-balance">Panel de control</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {summaryQuery.data?.tenant.name ?? 'Tenant actual'} ·{' '}
            {new Intl.DateTimeFormat('es-MX', { dateStyle: 'full' }).format(new Date())}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div className="metric-card flex items-start justify-between p-4 sm:p-5" key={metric.label}>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-xl sm:text-2xl font-semibold">{metric.value}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Actualizado en vivo
                </p>
              </div>
              <div className={`rounded-md p-1.5 sm:p-2 ${metric.color}`}>
                <metric.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          ))}
        </div>


        <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
          <div className="clinical-card overflow-hidden">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-clinical-warning-foreground" />
                <h2 className="text-sm font-semibold">Alertas clinicas</h2>
              </div>
            </div>
            <div className="space-y-3 p-4">
              {clinicalAlerts.length ? clinicalAlerts.map((alert, index) => (
                <div className="flex items-start gap-3 rounded-md border p-3 sm:p-4" key={index}>
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-clinical-warning-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-snug">{alert.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{alert.body}</p>
                  </div>
                </div>
              )) : <div className="text-sm text-muted-foreground">Sin alertas clinicas registradas.</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="clinical-card overflow-hidden">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Documentos pendientes</h2>
              </div>
              <Badge variant="warning">{pendingDocs.length}</Badge>
            </div>
            <div className="divide-y max-h-[300px] overflow-auto">
              {pendingDocs.length ? pendingDocs.map((document, index) => (
                <div className="cursor-pointer transition-all active:scale-[0.99] px-4 py-3 transition-colors hover:bg-muted/30 space-y-1" key={index}>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium">{document.title ?? 'Sin titulo'}</p>
                    <DocStatusBadge status={document.status ?? 'Borrador'} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {document.patient ?? 'Sin paciente'} · {document.type ?? 'Sin tipo'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{document.time ?? 'Sin fecha'}</p>
                </div>
              )) : <div className="px-4 py-6 text-sm text-muted-foreground">Sin documentos pendientes.</div>}
            </div>
          </div>

          <div className="clinical-card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Pacientes recientes</h2>
              </div>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y max-h-[300px] overflow-auto">
              {summaryQuery.data?.recentEncounters.length ? (
                summaryQuery.data.recentEncounters.map((encounter) => (
                  <div className="flex cursor-pointer transition-all active:scale-[0.99] items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30" key={encounter.id}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{encounter.patientName}</p>
                        <p className="text-xs text-muted-foreground">{encounter.encounterNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-start sm:items-center gap-3 text-left sm:text-right w-full sm:w-auto">
                      <div>
                        <p className="text-xs text-muted-foreground">{encounter.encounterType}</p>
                        <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(encounter.openedAt)}
                        </p>
                      </div>
                      <StatusBadge status={encounter.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-muted-foreground">Sin episodios recientes.</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
          <div className="clinical-card overflow-hidden">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Auditoria reciente</h2>
              </div>
            </div>
            <div className="divide-y max-h-[300px] overflow-auto">
              {auditRecent.length ? auditRecent.map((entry, index) => (
                <div className="flex items-start gap-3 px-4 py-3" key={index}>
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-clinical-success" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium break-words">{entry.action}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.entity ?? 'Sin entidad'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">{entry.user ?? 'Sistema'}</p>
                    <p className="text-xs text-muted-foreground">{entry.time ?? 'Sin hora'}</p>
                  </div>
                </div>
              )) : <div className="px-4 py-6 text-sm text-muted-foreground">Sin eventos de auditoria.</div>}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
