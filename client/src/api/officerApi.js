import { request } from './client';

export const getOfficerBlocks = () => request('/api/officer/blocks');
