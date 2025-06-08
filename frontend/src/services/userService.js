import API from '../utils/API';

/**
 * Get all users
 * @returns {Promise<Array>} List of users
 */
export const getAllUsers = async () => {
  try {
    const response = await API.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get a user by ID
 * @param {number} id User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (id) => {
  try {
    const response = await API.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new user
 * @param {Object} userData User data
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
  try {
    const response = await API.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update a user
 * @param {number} id User ID
 * @param {Object} userData Updated user data
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (id, userData) => {
  try {
    const response = await API.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a user
 * @param {number} id User ID
 * @returns {Promise<Object>} Response data
 */
export const deleteUser = async (id) => {
  try {
    const response = await API.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
  }
};

/**
 * Get users by role
 * @param {string} role User role (admin, waiter, kitchen)
 * @returns {Promise<Array>} List of users with the specified role
 */
export const getUsersByRole = async (role) => {
  try {
    const allUsers = await getAllUsers();
    return allUsers.filter(user => user.role === role);
  } catch (error) {
    console.error(`Error fetching users by role ${role}:`, error);
    throw error;
  }
};

/**
 * Change user password
 * @param {number} id User ID
 * @param {Object} passwordData Password data (oldPassword, newPassword)
 * @returns {Promise<Object>} Response data
 */
export const changePassword = async (id, passwordData) => {
  try {
    const response = await API.post(`/users/${id}/change-password`, passwordData);
    return response.data;
  } catch (error) {
    console.error(`Error changing password for user ${id}:`, error);
    throw error;
  }
};

/**
 * Get current user profile
 * @returns {Promise<Object>} Current user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await API.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

/**
 * Update current user profile
 * @param {Object} userData Updated user data
 * @returns {Promise<Object>} Updated user
 */
export const updateCurrentUser = async (userData) => {
  try {
    const response = await API.put('/users/me', userData);
    return response.data;
  } catch (error) {
    console.error('Error updating current user:', error);
    throw error;
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  changePassword,
  getCurrentUser,
  updateCurrentUser
}; 