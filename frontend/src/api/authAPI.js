import api from './axiosConfig';

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Product APIs
export const productAPI = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  searchProducts: (query) => api.get('/products', { params: { search: query } }),
  filterByCategory: (categoryId) => api.get('/products', { params: { categoryId } }),
  filterByPrice: (minPrice, maxPrice) => 
    api.get('/products', { params: { minPrice, maxPrice } }),
};

// Cart APIs
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  updateCartItem: (data) => api.put('/cart/update', data),
  removeFromCart: (productId) => api.delete(`/cart/remove/${productId}`),
  clearCart: () => api.delete('/cart/clear'),
};

// Order APIs
export const orderAPI = {
  placeOrder: (data) => api.post('/orders', data),
  getUserOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// User APIs
export const userAPI = {
  getUserProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  addAddress: (data) => api.post('/users/address', data),
  addToWishlist: (productId) => api.post('/users/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/users/wishlist/${productId}`),
};

// Review APIs
export const reviewAPI = {
  createReview: (data) => api.post('/reviews', data),
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

// Analytics APIs
export const analyticsAPI = {
  getMonthlyRevenue: () => api.get('/analytics/revenue'),
  getTopProducts: () => api.get('/analytics/top-products'),
  getLowStockProducts: () => api.get('/analytics/low-stock'),
  getTrendingProducts: () => api.get('/analytics/trending'),
};

export default api;
