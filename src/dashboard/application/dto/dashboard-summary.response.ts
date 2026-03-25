export interface DashboardMetricResponse {
  label: string;
  value: number;
  accent: string;
}

export interface DashboardEncounterSnapshotResponse {
  id: string;
  encounterNumber: string;
  encounterType: string;
  status: string;
  patientName: string;
  facilityName: string | null;
  openedAt: string;
}

export interface DashboardSummaryResponse {
  tenant: {
    id: string;
    name: string;
  };
  metrics: DashboardMetricResponse[];
  recentEncounters: DashboardEncounterSnapshotResponse[];
}
