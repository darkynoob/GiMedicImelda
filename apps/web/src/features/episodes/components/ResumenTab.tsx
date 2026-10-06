import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../../components/ui/badge';
import { formatDateTime } from '../../../shared/lib/formatters';
import { useAuth } from '../../auth/hooks/auth-context';
import { fetchEpisodeSummary } from '../api/episode-summary.service';

type ResumenTabProps = {
  encounterNumber: string;
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

const statusBadgeVariant = (status: string): 'draft' | 'success' | 'default' => {
  if (status === 'DRAFT') return 'draft';
  if (status === 'FINALIZED') return 'success';
  return 'default';
};

/// Tab "Resumen" (Fase 6). Vista ejecutiva de solo lectura; no copia datos, consulta en vivo
/// el endpoint agregador `GET /encounters/:encounterNumber/summary` (spec 6.17/6.22).
export function ResumenTab({ encounterNumber }: ResumenTabProps) {
  const { session } = useAuth();
  const token = session!.accessToken;

  const summaryQuery = useQuery({
    queryKey: ['episode-summary', encounterNumber],
    queryFn: () => fetchEpisodeSummary(token, encounterNumber),
  });

  if (summaryQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando resumen...</p>;
  }

  const summary = summaryQuery.data;
  if (!summary) {
    return <p className="text-sm text-muted-foreground">No se pudo cargar el resumen.</p>;
  }

  return (
    <div className="space-y-5">
      <Card title="Episodio">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <span>Paciente: {summary.header.patientFullName ?? 'Sin nombre'}</span>
          <span>Episodio: {summary.header.encounterNumber}</span>
          <span>Tipo: {summary.header.encounterType}</span>
          <span>Estado: {summary.header.encounterStatus}</span>
          <span>Abierto: {summary.header.openedAt ? formatDateTime(summary.header.openedAt) : '—'}</span>
          <span>Cerrado: {summary.header.closedAt ? formatDateTime(summary.header.closedAt) : '—'}</span>
        </div>
        {summary.header.reasonForVisit ? (
          <p className="text-sm text-muted-foreground">Motivo: {summary.header.reasonForVisit}</p>
        ) : null}
      </Card>

      <Card title="Estado clínico rápido">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Alergias ({summary.quickClinicalStatus.allergiesCount})
            </p>
            {summary.quickClinicalStatus.allergies.length ? (
              <ul className="flex flex-wrap gap-1">
                {summary.quickClinicalStatus.allergies.map((allergy, index) => (
                  <li
                    className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
                    key={index}
                  >
                    {allergy.substance}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Sin alergias.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Problemas activos ({summary.quickClinicalStatus.activeProblemsCount})
            </p>
            {summary.quickClinicalStatus.activeProblems.length ? (
              <ul className="list-inside list-disc text-xs">
                {summary.quickClinicalStatus.activeProblems.map((problem) => (
                  <li key={problem.id}>{problem.description}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Sin problemas activos.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Medicación crónica</p>
            <p className="text-sm">{summary.quickClinicalStatus.activeMedicationsCount}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Estudios pendientes</p>
            <p className="text-sm">{summary.quickClinicalStatus.pendingStudiesCount}</p>
          </div>
        </div>
      </Card>

      <Card title="Resumen clínico">
        <p className="text-sm">Motivo principal: {summary.clinicalSummary.chiefComplaint ?? 'Sin registrar'}</p>
        <p className="text-sm">
          Diagnóstico principal:{' '}
          {summary.clinicalSummary.primaryDiagnosis
            ? `${summary.clinicalSummary.primaryDiagnosis.description} (${summary.clinicalSummary.primaryDiagnosis.code ?? 's/c'}) · fuente: ${summary.clinicalSummary.primaryDiagnosis.source}`
            : 'Sin registrar'}
        </p>
        <p className="text-sm">Estado clínico: {summary.clinicalSummary.clinicalStatus ?? 'Sin registrar'}</p>
      </Card>

      <Card title="Últimos signos vitales">
        {summary.latestVitalSigns ? (
          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
            {JSON.stringify(summary.latestVitalSigns, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">Sin signos vitales registrados.</p>
        )}
      </Card>

      <Card title="Última evolución">
        {summary.latestEvolution ? (
          <div className="space-y-1 text-sm">
            <p>Evolución #{summary.latestEvolution.noteNumber}</p>
            {summary.latestEvolution.recordedAt ? (
              <p>Registrada: {formatDateTime(summary.latestEvolution.recordedAt)}</p>
            ) : null}
            <p>Estado clínico: {summary.latestEvolution.clinicalStatus ?? 'Sin registrar'}</p>
            <p>Tendencia: {summary.latestEvolution.trend ?? 'Sin registrar'}</p>
            {summary.latestEvolution.plan ? <p>Plan: {summary.latestEvolution.plan}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin evoluciones finalizadas todavía.</p>
        )}
      </Card>

      <Card title="Estudios y resultados">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <span>Laboratorio pendiente: {summary.studiesAndResults.labPending}</span>
          <span>Laboratorio con resultado: {summary.studiesAndResults.labWithResult}</span>
          <span>Imagenología pendiente: {summary.studiesAndResults.imagingPending}</span>
          <span>Imagenología con resultado: {summary.studiesAndResults.imagingWithResult}</span>
        </div>
      </Card>

      <Card title="Última receta">
        {summary.latestPrescription ? (
          <div className="space-y-1 text-sm">
            <p>Folio: {summary.latestPrescription.folio}</p>
            <p>Estado: {summary.latestPrescription.status ?? 'Sin registrar'}</p>
            <p>Medicamentos: {summary.latestPrescription.medicationCount}</p>
            {summary.latestPrescription.nextAppointmentDate ? (
              <p>Próxima cita: {formatDateTime(summary.latestPrescription.nextAppointmentDate)}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin recetas todavía.</p>
        )}
      </Card>

      <Card title="Documentos">
        <p className="text-sm">Total: {summary.documents.total}</p>
        {summary.documents.recent.length ? (
          <ul className="space-y-1">
            {summary.documents.recent.map((doc) => (
              <li className="flex items-center justify-between text-sm" key={doc.id}>
                <span>{doc.title}</span>
                <Badge variant={statusBadgeVariant(doc.status)}>{doc.status}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin documentos todavía.</p>
        )}
      </Card>

      <Card title="Estado de documentación clínica">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <span>Historia clínica: {summary.documentStatusOverview.clinicalHistory}</span>
          <span>Consulta actual: {summary.documentStatusOverview.consultationNote}</span>
          <span>Evoluciones: {summary.documentStatusOverview.evolutionNotesCount}</span>
          <span>Recetas: {summary.documentStatusOverview.prescriptionsCount}</span>
          <span>Documentos: {summary.documentStatusOverview.documentsCount}</span>
        </div>
      </Card>

      <Card title="Línea de tiempo (últimos eventos finalizados)">
        {summary.timeline.length ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {summary.timeline.map((event, index) => (
              <li key={index}>
                {formatDateTime(event.createdAt)} · {event.action} · {event.entityType}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin eventos todavía.</p>
        )}
      </Card>
    </div>
  );
}
