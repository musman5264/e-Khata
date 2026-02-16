import api from './api';

class NotificationService {
  async getAll() {
    const res = await api.get('/notifications');
    return res.data.data;
  }

  async getUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return res.data.data?.count ?? 0;
  }

  async markAsRead(id: string) {
    const res = await api.post(`/notifications/${id}/read`);
    return res.data;
  }

  async markAllAsRead() {
    const res = await api.post('/notifications/read-all');
    return res.data;
  }

  async getPreferences() {
    const res = await api.get('/notifications/preferences');
    return res.data.data;
  }

  async updatePreferences(prefs: Record<string, boolean>) {
    const res = await api.put('/notifications/preferences', prefs);
    return res.data;
  }

  async registerFcmToken(token: string) {
    const res = await api.post('/sessions/fcm-token', { fcm_token: token });
    return res.data;
  }
}

export const notificationService = new NotificationService();
