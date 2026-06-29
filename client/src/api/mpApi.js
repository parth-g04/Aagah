import { request } from './client';

export const getMPSummary = () => request('/api/mp/summary');
export const getMPBlocks = () => request('/api/mp/blocks');
