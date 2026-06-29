import { request } from './client';

export const sendOTP = (phone) => 
  request('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone })
  });

export const verifyOTP = (phone, code) => 
  request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code })
  });

export const logout = () => 
  request('/api/auth/logout', {
    method: 'POST'
  });

export const googleLogin = (credential) =>
  request('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential })
  });
