import { apiRequest } from './client';

export async function getCandidateProfileApi() {
  return await apiRequest('/candidate/profile', {
    method: 'GET',
  });
}

export async function uploadCandidateResumeApi(file) {
  const formData = new FormData();
  formData.append('file', file);
  return await apiRequest('/candidate/upload_resume', {
    method: 'POST',
    body: formData,
  });
}
