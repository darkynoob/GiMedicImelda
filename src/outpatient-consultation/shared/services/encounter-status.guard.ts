import { ForbiddenException } from '@nestjs/common';

/// Bloquea captura clínica ordinaria cuando el episodio ya está Cerrado (regla transversal:
/// una Nota de cierre Finalizada impide nuevas notas clínicas ordinarias en ese episodio).
export function assertEncounterOpen(encounter: { status: string }): void {
  if (encounter.status !== 'OPEN') {
    throw new ForbiddenException(
      'El episodio está Cerrado; no se puede capturar ni modificar contenido clínico ordinario.',
    );
  }
}
