import { apiRequest } from './client';

export async function getHRAnalyticsApi() {
  return await apiRequest('/hr/analytics', {
    method: 'GET',
  });
}
