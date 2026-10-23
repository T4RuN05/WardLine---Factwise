const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(message, code = 'API_ERROR', status = 500, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const token = sessionStorage.getItem('wardline_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const cleanBase = BASE_URL.replace(/\/+$/, '');
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (cleanBase.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.replace(/^\/api/, '');
  }
  const url = `${cleanBase}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      const err = payload?.error || {};
      throw new ApiError(
        err.message || `Request failed with status ${response.status}`,
        err.code || 'HTTP_ERROR',
        response.status,
        err.details || {}
      );
    }

    if (payload?.data !== undefined) {
      if (typeof payload.data === 'object' && payload.data !== null) {
        if (!Array.isArray(payload.data)) {
          return {
            ...payload.data,
            data: payload.data,
            success: payload.success,
            meta: payload.meta,
          };
        } else {
          payload.data.data = payload.data;
          return payload.data;
        }
      }
      return payload.data;
    }
    return payload;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network error connecting to API.', 'NETWORK_ERROR', 0);
  }
}

export const api = {
  get: (endpoint, query = {}) => {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    }
    const qs = params.toString();
    return request(`${endpoint}${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  post: (endpoint, body = {}) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  patch: (endpoint, body = {}) => {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  },
};
