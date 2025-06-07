// src/services/apiService.js

// This will use the URL from our deployment environment, or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// This token variable will be private to this module
let token = null;

// This function allows other parts of our app (like App.jsx) to set the token
const setToken = newToken => {
  token = `Bearer ${newToken}`;
};

// A helper function to handle API responses consistently
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) return null; // For successful DELETE requests
  return response.json();
};
// --- NEW LOGIN FUNCTION ---
const login = async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    return handleResponse(response);
};
// --- Tenant API Functions ---

const getTenants = async () => {
  const response = await fetch(`${API_BASE_URL}/tenants`, {
    headers: { 'Authorization': token } // Send the token with the request
  });
  return handleResponse(response);
};

const createTenant = async (tenantData) => {
    const response = await fetch(`${API_BASE_URL}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(tenantData)
    });
    return handleResponse(response);
};

const updateTenant = async (tenantId, updates) => {
    const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(updates)
    });
    return handleResponse(response);
};

const deleteTenant = async (tenantId) => {
    const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
    });
    return handleResponse(response);
};

// --- Payment API Functions ---

const createPayment = async (tenantId, paymentData) => {
    const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(paymentData)
    });
    return handleResponse(response);
};


// --- The object that we will export ---
// This exposes our functions to the rest of the application.
const apiService = {
  login,
  setToken,
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  createPayment,
};
    
export default apiService;