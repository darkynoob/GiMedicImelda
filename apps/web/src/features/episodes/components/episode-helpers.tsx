import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BedDouble,
  CalendarClock,
  CircleAlert,
  Scissors,
  Siren,
  Stethoscope,
} from 'lucide-react';
import { getEpisodeTabsForType } from './episode-profile-schema';

export const supportedEncounterTypes = [
  'OUTPATIENT',
  'EMERGENCY',
  'HOSPITALIZATION',
  'SURGERY',
] as const;

export const encounterTypeConfig: Record<
  string,
  {
    label: string;
    icon: LucideIcon;
    className: string;
    cardClassName: string;
    detailTabLabel: string;
  }
> = {
  OUTPATIENT: {
    label: 'Consulta',
    icon: Stethoscope,
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    cardClassName: 'bg-sky-50 text-sky-700',
    detailTabLabel: 'Consulta actual',
  },
  EMERGENCY: {
    label: 'Urgencia',
    icon: Siren,
    className: 'bg-red-50 text-red-700 border-red-200',
    cardClassName: 'bg-red-50 text-red-700',
    detailTabLabel: 'Triage / ingreso',
  },
  HOSPITALIZATION: {
    label: 'Hospitalizacion',
    icon: BedDouble,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    cardClassName: 'bg-amber-50 text-amber-700',
    detailTabLabel: 'Ingreso',
  },
  SURGERY: {
    label: 'Procedimiento',
    icon: Scissors,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cardClassName: 'bg-emerald-50 text-emerald-700',
    detailTabLabel: 'Procedimiento',
  },
  FOLLOW_UP: {
    label: 'Seguimiento',
    icon: CalendarClock,
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    cardClassName: 'bg-violet-50 text-violet-700',
    detailTabLabel: 'Seguimiento',
  },
};

export const encounterStatusConfig: Record<
  string,
  { label: string; badgeVariant: 'success' | 'secondary' | 'warning' | 'alert' }
> = {
  OPEN: { label: 'Abierto', badgeVariant: 'success' },
  CLOSED: { label: 'Cerrado', badgeVariant: 'secondary' },
  CANCELLED: { label: 'Cancelado', badgeVariant: 'alert' },
};

export const admissionSourceLabels: Record<string, string> = {
  CONSULTATION: 'Consulta',
  EMERGENCY: 'Urgencias',
  TRANSFER: 'Traslado',
  SURGERY: 'Cirugia',
  OTHER: 'Otro',
};

export const timelineKindConfig: Record<
  string,
  {
    label: string;
    icon: LucideIcon;
    className: string;
  }
> = {
  episode: {
    label: 'Episodio',
    icon: Activity,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  document: {
    label: 'Documento',
    icon: Stethoscope,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  vital: {
    label: 'Vital',
    icon: Activity,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  diagnosis: {
    label: 'Diagnostico',
    icon: CircleAlert,
    className: 'bg-violet-50 text-violet-700 border-violet-200',
  },
};

export function getEncounterTabs(encounterType: string) {
  return getEpisodeTabsForType(
    supportedEncounterTypes.includes(encounterType as never)
      ? encounterType
      : 'OUTPATIENT',
  );
}

export function formatEncounterType(encounterType: string) {
  return encounterTypeConfig[encounterType]?.label ?? encounterType;
}

export function formatEncounterStatus(status: string) {
  return encounterStatusConfig[status]?.label ?? status;
}
