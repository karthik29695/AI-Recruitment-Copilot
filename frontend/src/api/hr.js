import { apiRequest } from './client';

export async function getHRAnalyticsApi() {
  return await apiRequest('/hr/analytics', {
    method: 'GET',
  });
}

export async function getHRRequisitionsApi() {
  return await apiRequest('/hr/requisitions', {
    method: 'GET',
  });
}

export async function getHRCandidatesApi() {
  return await apiRequest('/hr/candidates', {
    method: 'GET',
  });
}

export async function updateHRCandidateStatusApi(matchId, status) {
  return await apiRequest(`/hr/candidates/${matchId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}
