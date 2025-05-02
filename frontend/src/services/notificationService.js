import axios from 'axios';

const API_URL = 'http://localhost:3000/api/profile/notifications/';

// Get all notifications
const getNotifications = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL, config);
  return response.data;
};

// Mark notification as read
const markAsRead = async (token, id) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(API_URL + id + '/read', {}, config);
  return response.data;
};

const notificationService = {
  getNotifications,
  markAsRead,
};

export default notificationService;