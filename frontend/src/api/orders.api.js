
import api from './axios';

export const getOrders = (params) => api.get('/orders', { params });

export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);

export const getOrderHistory = (orderId) => api.get(`/orders/${orderId}/history`);

export const createOrder = (data) => api.post('/orders', data);

export const updateOrderStatus = (orderId, data) => api.put(`/orders/${orderId}/status`, data);

export const getOrderStatuses = () => api.get('/order-statuses');

export const getMerchants = () => api.get('/merchants');