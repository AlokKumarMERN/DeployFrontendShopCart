import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If server says to clear auth, logout user
    if (error.response?.data?.clearAuth) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Reload to reset state
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateAddresses: (addresses) => api.put('/auth/addresses', { addresses }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
  // Wishlist
  getWishlist: () => api.get('/auth/wishlist'),
  checkWishlist: (productId) => api.get(`/auth/wishlist/check/${productId}`),
  addToWishlist: (productId) => api.post(`/auth/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/auth/wishlist/${productId}`),
  // Notifications
  getNotifications: () => api.get('/auth/notifications'),
  getNotificationCount: () => api.get('/auth/notifications/count'),
  markNotificationRead: (notificationId) => api.put(`/auth/notifications/${notificationId}/read`),
  markAllNotificationsRead: () => api.put('/auth/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/auth/notifications/${notificationId}`),
  // Settings
  getSettings: () => api.get('/auth/settings'),
  updateSettings: (settings) => api.put('/auth/settings', settings),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  search: (query) => api.get('/products/search', { params: { q: query } }),
  getByCategory: (category, limit) =>
    api.get(`/products/category/${category}`, { params: { limit } }),
  canReview: (id) => api.get(`/products/${id}/can-review`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getStats: () => api.get('/products/admin/stats'),
};

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getAllAdmin: () => api.get('/orders?all=true'),
  getById: (id) => api.get(`/orders/${id}`),
  getInvoice: (id) => api.get(`/orders/${id}/invoice`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  getStats: () => api.get('/orders/admin/stats'),
  exportExactDelivery: (params) => api.get('/orders/export/exact-delivery', { params }),
  exportNormalDelivery: (params) => api.get('/orders/export/normal-delivery', { params }),
};

// Replacements API
export const replacementsAPI = {
  // User endpoints
  checkEligibility: (orderId, productId) => api.get(`/replacements/check/${orderId}/${productId}`),
  request: (data) => api.post('/replacements', data),
  getUserReplacements: () => api.get('/replacements'),
  getById: (id) => api.get(`/replacements/${id}`),
  // Admin endpoints
  getAll: () => api.get('/replacements/admin/all'),
  getStats: () => api.get('/replacements/admin/stats'),
  update: (id, data) => api.put(`/replacements/${id}`, data),
};

// Contact API
export const contactAPI = {
  submitFeedback: (data) => api.post('/contact/feedback', data),
};

// Cart API
export const cartAPI = {
  get: () => api.get('/cart'),
  update: (cart) => api.put('/cart', { cart }),
  clear: () => api.delete('/cart'),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Filters API (for custom admin-defined filters)
export const filtersAPI = {
  getAll: () => api.get('/filters'),
  getAllAdmin: () => api.get('/filters/admin'),
  create: (data) => api.post('/filters', data),
  update: (id, data) => api.put(`/filters/${id}`, data),
  delete: (id) => api.delete(`/filters/${id}`),
  addOption: (id, data) => api.post(`/filters/${id}/options`, data),
  removeOption: (id, optionId) => api.delete(`/filters/${id}/options/${optionId}`),
};

// Coupons API
export const couponsAPI = {
  // Admin endpoints
  getAll: () => api.get('/coupons/admin'),
  getById: (id) => api.get(`/coupons/admin/${id}`),
  getStats: () => api.get('/coupons/admin/stats'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
  // User endpoints
  apply: (code, orderAmount) => api.post('/coupons/apply', { code, orderAmount }),
};

// Customers API (Admin)
export const customersAPI = {
  getAll: () => api.get('/customers/admin'),
  getById: (id) => api.get(`/customers/admin/${id}`),
  getStats: () => api.get('/customers/admin/stats'),
  matchCriteria: (criteria) => api.post('/customers/admin/match-criteria', criteria),
};

// Delivery Boys API (Admin)
export const deliveryBoysAPI = {
  getAll: () => api.get('/delivery-boys'),
  getActive: () => api.get('/delivery-boys/active'),
  getById: (id) => api.get(`/delivery-boys/${id}`),
  create: (data) => api.post('/delivery-boys', data),
  update: (id, data) => api.put(`/delivery-boys/${id}`, data),
  delete: (id) => api.delete(`/delivery-boys/${id}`),
};

// Pin Codes API
export const pinCodesAPI = {
  getAll: () => api.get('/pincodes'),
  check: (pincode) => api.get(`/pincodes/check/${pincode}`),
  create: (data) => api.post('/pincodes', data),
  update: (id, data) => api.put(`/pincodes/${id}`, data),
  delete: (id) => api.delete(`/pincodes/${id}`),
  bulkUpload: (pinCodes) => api.post('/pincodes/bulk', { pinCodes }),
};

export default api;
