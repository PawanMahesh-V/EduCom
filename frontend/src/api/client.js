
const getAuthToken = () => {
  // Standardize on localStorage for auth token
  return localStorage.getItem('userToken');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Auto-logout on 401
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');

    // Dispatch custom event for AuthContext to catch
    window.dispatchEvent(new Event('auth:logout'));

    // If we are not already on the login page, redirect
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    const error = (data && data.message) || response.statusText;
    return Promise.reject(error);
  }
  return data;
};

class ApiClient {
  static async get(url, options = {}) {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      ...options,
    });
    return handleResponse(response);
  }

  static async post(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  }

  static async put(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  }

  static async delete(url, options = {}) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      ...options,
    });
    return handleResponse(response);
  }

  static async patch(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  }
}

export default ApiClient;
