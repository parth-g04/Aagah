import { request } from './client';

export const getInterventions = (status = '', blockId = '', q = '', lang = '') => {
  const query = new URLSearchParams();
  if (status) query.append('status', status);
  if (blockId) query.append('blockId', blockId);
  if (q) query.append('q', q);
  if (lang) query.append('lang', lang);
  return request(`/api/interventions?${query.toString()}`);
};

export const createIntervention = (data) =>
  request('/api/interventions', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const patchIntervention = (id, data) =>
  request(`/api/interventions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
