import { apiRequest } from '../../../shared/http/api-client';
import type { DashboardSummaryResponse } from '../../../shared/types/contracts';

export function fetchDashboardSummary(token: string) {
  return apiRequest<DashboardSummaryResponse>('/dashboard/summary', { token });
}
