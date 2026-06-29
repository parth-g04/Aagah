import { request } from './client';

export const getBlockDetail = (id) => request(`/api/blocks/${id}`);
