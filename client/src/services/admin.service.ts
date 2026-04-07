import api from './api';

export const adminService = {
  // Verify admin access
  async verifyAdmin() {
    const res = await api.get('/admin/verify');
    return res.data;
  },

  // Dashboard stats
  async getDashboardStats() {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },

  // Users
  async getUsers(page = 1, limit = 20, search?: string) {
    const params: any = { page, limit };
    if (search) params.search = search;
    const res = await api.get('/admin/users', { params });
    return res.data.data;
  },

  async getUser(userId: string) {
    const res = await api.get(`/admin/users/${userId}`);
    return res.data.data;
  },

  async suspendUser(userId: string) {
    const res = await api.post(`/admin/users/${userId}/suspend`);
    return res.data;
  },

  async activateUser(userId: string) {
    const res = await api.post(`/admin/users/${userId}/activate`);
    return res.data;
  },

  async grantCredits(userId: string, credits: number, reason?: string) {
    const res = await api.post(`/admin/users/${userId}/grant-credits`, { credits, reason });
    return res.data;
  },

  // Revenue
  async getRevenueOverview() {
    const res = await api.get('/admin/revenue');
    return res.data.data;
  },

  // Feedback
  async getFeedback(page = 1, limit = 20, status?: string) {
    const params: any = { page, limit };
    if (status) params.status = status;
    const res = await api.get('/admin/feedback', { params });
    return res.data.data;
  },

  async updateFeedback(feedbackId: string, data: { status?: string; admin_notes?: string }) {
    const res = await api.patch(`/admin/feedback/${feedbackId}`, data);
    return res.data;
  },

  // Onboarding emails
  async sendOnboardingEmail(recipientUserId: string, subject: string, body: string) {
    const res = await api.post('/admin/send-onboarding-email', { recipientUserId, subject, body });
    return res.data;
  },

  async getEmailLog(page = 1) {
    const res = await api.get('/admin/email-log', { params: { page } });
    return res.data.data;
  },
};
