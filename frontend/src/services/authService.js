const API_URL = 'http://localhost:5000/api';

export const login = async (identifier, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to login');
    }

    const data = await response.json();
    // Store the token in localStorage
    if (data.token) {
      localStorage.setItem('userToken', data.token);
    }
    return data;
  } catch (error) {
    throw error;
  }
};