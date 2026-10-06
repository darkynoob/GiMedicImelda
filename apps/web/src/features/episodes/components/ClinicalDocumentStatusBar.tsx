import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { formatDateTime } from '../../../shared/lib/formatters';

type ClinicalDocumentStatusBarProps = {
  status: 'DRAFT' | 'FINALIZED';
  versionNumber: number;
  recordedAt?: string | null;
  finalizedAt?: string | null;
  onSave?: () => void;
  onFinalize?: () => void;
  onCreateNewVersion?: () => void;
  isSaving?: boolean;
};

/// Barra de estado documental compartida (regla 0.7): Borrador/Finalizado + número de versión,
/// sin mostrar nunca "Firmado/Firmada" mientras no exista FEA real (regla 0.1).
export function ClinicalDocumentStatusBar({
  status,
  versionNumber,
  recordedAt,
  finalizedAt,
  onSave,
  onFinalize,
  onCreateNewVersion,
  isSaving,
}: ClinicalDocumentStatusBarProps) {
  const isDraft = status === 'DRAFT';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <Badge variant={isDraft ? 'draft' : 'success'}>
          {isDraft ? 'Borrador' : 'Finalizado'}
        </Badge>
        <span className="text-xs text-muted-foreground">Versión {versionNumber}</span>
        {recordedAt ? (
          <span className="text-xs text-muted-foreground">
            Registrado: {formatDateTime(recordedAt)}
          </span>
        ) : null}
        {!isDraft && finalizedAt ? (
          <span className="text-xs text-muted-foreground">
            Finalizado: {formatDateTime(finalizedAt)}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {isDraft && onSave ? (
          <Button disabled={isSaving} onClick={onSave} size="sm" type="button" variant="outline">
            Guardar borrador
          </Button>
        ) : null}
        {isDraft && onFinalize ? (
          <Button disabled={isSaving} onClick={onFinalize} size="sm" type="button">
            Finalizar
          </Button>
        ) : null}
        {!isDraft && onCreateNewVersion ? (
          <Button onClick={onCreateNewVersion} size="sm" type="button" variant="outline">
            Nueva versión
          </Button>
        ) : null}
      </div>
    </div>
  );
}
