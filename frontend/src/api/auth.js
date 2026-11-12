import { apiRequest } from './client';

export async function loginApi({ email, password, role }) {
  return await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
}

export async function registerApi({
  email,
  password,
  full_name,
  role,
  company_or_institution,
  phone,
}) {
  return await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      full_name,
      role,
      company_or_institution,
      phone,
    }),
  });
}

export async function getMeApi() {
  return await apiRequest('/auth/me', {
    method: 'GET',
  });
}

export async function getDemoAccountsApi() {
  return await apiRequest('/auth/demo-accounts', {
    method: 'GET',
  });
}
