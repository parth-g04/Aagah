export async function request(url, options = {}) {
  const token = localStorage.getItem('aagah_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (err) {
    throw new Error('Unable to connect. Check your internet connection.');
  }

  if (response.status === 401) {
    localStorage.removeItem('aagah_token');
    localStorage.removeItem('aagah_user');
    // Dispatch a custom event to let the context know we need to logout
    window.dispatchEvent(new Event('aagah_auth_401'));
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error: ${response.status}`);
  }

  return response.json();
}
