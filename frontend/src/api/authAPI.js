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
  getRecentlyViewed: () => api.get('/products/recently-viewed'),
  getUniqueViews: (productId) => api.get(`/products/${productId}/views`),
};

// Cart APIs
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  updateCartItem: (data) => api.put('/cart/update', data),
  removeFromCart: (productId) => api.delete(`/cart/remove/${productId}`),
  clearCart: () => api.delete('/cart/clear'),
};

// Guest cart APIs (no auth — uses guestId UUID from localStorage)
export const guestCartAPI = {
  getCart: (guestId) => api.get(`/cart/guest/${guestId}`),
  addToCart: (guestId, data) => api.post(`/cart/guest/${guestId}/add`, data),
  updateCartItem: (guestId, data) => api.put(`/cart/guest/${guestId}/update`, data),
  removeFromCart: (guestId, productId) => api.delete(`/cart/guest/${guestId}/remove/${productId}`),
  clearCart: (guestId) => api.delete(`/cart/guest/${guestId}/clear`),
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
  removeAddress: (addressId) => api.delete(`/users/address/${addressId}`),
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

// Seller APIs
export const sellerAPI = {
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  uploadImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  becomeSeller: (data) => api.post('/sellers', data),
  getSellerProfile: (sellerId) => api.get(`/sellers/${sellerId}`),
  updateSellerProfile: (data) => api.put('/sellers/profile', data),
  getAllSellers: () => api.get('/sellers'),
  getMyProducts: (params) => api.get('/sellers/my/products', { params }),
  getMyOrders: (params) => api.get('/sellers/my/orders', { params }),
  updateOrderStatus: (orderId, status) => api.put(`/sellers/my/orders/${orderId}/status`, { status }),
};

// Category APIs
export const categoryAPI = {
  getAllCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Analytics APIs
export const analyticsAPI = {
  getMonthlyRevenue: (params) => api.get('/analytics/revenue', { params }),
  getDailySalesReport: (params) => api.get('/analytics/revenue/daily', { params }),
  getTopProducts: () => api.get('/analytics/top-products'),
  getLowStockProducts: () => api.get('/analytics/low-stock'),
  getTrendingProducts: () => api.get('/analytics/trending'),
  getProductAnalytics: () => api.get('/analytics/product-analytics'),
  getUserActivity: () => api.get('/analytics/user-activity'),
  getMostViewedVsPurchased: () => api.get('/analytics/viewed-vs-purchased'),
  getTopBuyers: (params) => api.get('/analytics/leaderboard/buyers', { params }),
  getTopSellers: () => api.get('/analytics/leaderboard/sellers'),
};

// Admin APIs
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  getRedisInfo: () => api.get('/admin/redis-info'),
  getMongoProfile: () => api.get('/admin/mongo-profile'),
  setMongoProfile: (data) => api.post('/admin/mongo-profile', data),
};

export default api;
