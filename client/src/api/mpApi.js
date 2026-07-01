import { request } from './client';

export const getMPSummary = (lang) => request(`/api/mp/summary${lang ? `?lang=${lang}` : ''}`);
export const getMPBlocks = () => request('/api/mp/blocks');
export const queryMPBlocks = (query) => 
  request('/api/mp/query', {
    method: 'POST',
    body: JSON.stringify({ query })
  });
export const getDeviceWeather = (lat, lng) => request(`/api/mp/weather/device?lat=${lat}&lng=${lng}`);
export const getLocalCropNews = (location) => request(`/api/mp/news?location=${encodeURIComponent(location)}`);
export const getDeviceBlocks = (lat, lng) => request(`/api/mp/device-blocks?lat=${lat}&lng=${lng}`);
