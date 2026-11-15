import { apiRequest } from './client';

export async function getJobsApi() {
  return await apiRequest('/recruiter/jobs', {
    method: 'GET',
  });
}

export async function postJobApi(jobData) {
  return await apiRequest('/recruiter/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
}

export async function getJobCandidatesApi(jobId) {
  return await apiRequest(`/recruiter/jobs/${jobId}/candidates`, {
    method: 'GET',
  });
}

export async function getCandidateAnalysisApi(jobId, candidateId) {
  return await apiRequest(`/recruiter/jobs/${jobId}/candidates/${candidateId}/analysis`, {
    method: 'GET',
  });
}

export async function regenerateQuestionsApi(jobId, candidateId) {
  return await apiRequest(`/recruiter/jobs/${jobId}/candidates/${candidateId}/generate-questions`, {
    method: 'POST',
  });
}


export async function uploadResumeApi(file) {
  const formData = new FormData();
  formData.append('file', file);
  return await apiRequest('/recruiter/upload_resume', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadJDApi({ file, rawText }) {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (rawText) {
    formData.append('raw_text', rawText);
  }
  return await apiRequest('/recruiter/upload_jd', {
    method: 'POST',
    body: formData,
  });
}
