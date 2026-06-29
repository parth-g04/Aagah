import { request } from './client';

export const getAlerts = (status = '', blockId = '') => {
  const query = new URLSearchParams();
  if (status) query.append('status', status);
  if (blockId) query.append('blockId', blockId);
  return request(`/api/alerts?${query.toString()}`);
};

export const createAlert = (data) =>
  request('/api/alerts', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const patchAlert = (id, data) =>
  request(`/api/alerts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
