// API service for marketplace
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  // First check for token in currentSession (for email users)
  try {
    const session = JSON.parse(localStorage.getItem('currentSession') || '{}');
    if (session.token) {
      return session.token;
    }
  } catch (error) {
    console.error('Error parsing currentSession:', error);
  }
  
  // Fallback to authToken or token
  return localStorage.getItem('authToken') || localStorage.getItem('token');
};

// Helper function to create headers
const createHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Games API
export const gamesAPI = {
  // Get all games
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/games`);
    return handleResponse(response);
  }
};

// Game Accounts API
export const gameAccountsAPI = {
  // Get all game accounts with filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.gameId) queryParams.append('gameId', filters.gameId);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
    if (filters.sellerWallet) queryParams.append('sellerWallet', filters.sellerWallet);
    if (filters.isAvailable !== undefined) queryParams.append('isAvailable', filters.isAvailable);
    
    const url = `${API_BASE_URL}/game-accounts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get single game account
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/game-accounts/${id}`);
    return handleResponse(response);
  },

  // Create new game account
  create: async (accountData) => {
    const response = await fetch(`${API_BASE_URL}/game-accounts`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(accountData),
    });
    return handleResponse(response);
  },

  // Update game account
  update: async (id, accountData) => {
    const response = await fetch(`${API_BASE_URL}/game-accounts/${id}`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(accountData),
    });
    return handleResponse(response);
  },

  // Delete game account
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/game-accounts/${id}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  // Update account status (for escrow)
  updateStatus: async (id, statusData) => {
    const response = await fetch(`${API_BASE_URL}/game-accounts/${id}/status`, {
      method: 'PATCH',
      headers: createHeaders(false),
      body: JSON.stringify(statusData),
    });
    return handleResponse(response);
  }
};

// User Profile API
export const profileAPI = {
  // Get user profile
  get: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  // Update user profile
  update: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  // Get wallet profile
  getWalletProfile: async (walletAddress) => {
    const response = await fetch(`${API_BASE_URL}/wallet-profile/${walletAddress}`);
    return handleResponse(response);
  },

  // Create or update wallet profile
  updateWalletProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/wallet-profile`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  }
};

// Auth API
export const authAPI = {
  // Login
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  // Register
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  }
};

// Escrow API
export const escrowAPI = {
  // Create escrow transaction
  create: async (escrowData) => {
    const response = await fetch(`${API_BASE_URL}/escrow/create`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify(escrowData),
    });
    return handleResponse(response);
  },

  // Get escrow transactions
  getTransactions: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.wallet_address) queryParams.append('wallet_address', filters.wallet_address);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.role) queryParams.append('role', filters.role);
    
    const url = `${API_BASE_URL}/escrow/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get single escrow transaction
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/escrow/${id}`);
    return handleResponse(response);
  },

  // Update escrow status
  updateStatus: async (id, statusData) => {
    const response = await fetch(`${API_BASE_URL}/escrow/${id}/status`, {
      method: 'PATCH',
      headers: createHeaders(false),
      body: JSON.stringify(statusData),
    });
    return handleResponse(response);
  },

  // Confirm payment (admin)
  confirmPayment: async (id, paymentData) => {
    const response = await fetch(`${API_BASE_URL}/escrow/${id}/confirm-payment`, {
      method: 'PATCH',
      headers: createHeaders(false),
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  // Deliver account (seller)
  deliverAccount: async (id, deliveryData) => {
    console.log('🌐 API: Delivering account to:', `${API_BASE_URL}/escrow/${id}/deliver`);
    console.log('📦 API: Delivery data:', deliveryData);
    console.log('🔑 API: Headers:', createHeaders(false));
    
    const response = await fetch(`${API_BASE_URL}/escrow/${id}/deliver`, {
      method: 'PATCH',
      headers: createHeaders(false),
      body: JSON.stringify(deliveryData),
    });
    
    console.log('📡 API: Response status:', response.status);
    console.log('📡 API: Response ok:', response.ok);
    
    return handleResponse(response);
  },

  // Confirm receipt (buyer)
  confirmReceipt: async (id, confirmationData) => {
    const response = await fetch(`${API_BASE_URL}/escrow/${id}/confirm-receipt`, {
      method: 'PATCH',
      headers: createHeaders(false),
      body: JSON.stringify(confirmationData),
    });
    return handleResponse(response);
  },

  // Create dispute
  createDispute: async (id, disputeData) => {
    const response = await fetch(`${API_BASE_URL}/escrow/${id}/dispute`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify(disputeData),
    });
    return handleResponse(response);
  },

  // Release funds (admin)
  releaseFunds: async (id, releaseData) => {
    const response = await fetch(`${API_BASE_URL}/escrow/${id}/release`, {
      method: 'PATCH',
      headers: createHeaders(false),
      body: JSON.stringify(releaseData),
    });
    return handleResponse(response);
  },

  // Resolve dispute (admin)
  resolveDispute: async (id, resolutionData) => {
    const response = await fetch(`${API_BASE_URL}/escrow/${id}/resolve-dispute`, {
      method: 'PATCH',
      headers: createHeaders(false),
      body: JSON.stringify(resolutionData),
    });
    return handleResponse(response);
  }
};

// Health check API
export const healthAPI = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  }
};

export default {
  games: gamesAPI,
  gameAccounts: gameAccountsAPI,
  profile: profileAPI,
  auth: authAPI,
  escrow: escrowAPI,
  health: healthAPI
};