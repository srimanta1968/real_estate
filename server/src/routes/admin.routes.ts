import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { AdminService } from '../services/admin.service';

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// Verify admin access
router.get('/verify', async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = await AdminService.verifyAdmin(req.user!.userId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Not an admin' });
    }
    res.json({ success: true, data: { admin: true, email: req.user!.email } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Dashboard stats
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await AdminService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
});

// Users list
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const data = await AdminService.getUsers(page, limit, search);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, error: 'Failed to load users' });
  }
});

// Get single user
router.get('/users/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const data = await AdminService.getUser(req.params.userId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.message === 'User not found' ? 404 : 500).json({ success: false, error: error.message });
  }
});

// Suspend user
router.post('/users/:userId/suspend', async (req: AuthRequest, res: Response) => {
  try {
    const user = await AdminService.suspendUser(req.params.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to suspend user' });
  }
});

// Activate user
router.post('/users/:userId/activate', async (req: AuthRequest, res: Response) => {
  try {
    const user = await AdminService.activateUser(req.params.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to activate user' });
  }
});

// Grant trial credits
router.post('/users/:userId/grant-credits', async (req: AuthRequest, res: Response) => {
  try {
    const { credits, reason } = req.body;
    if (!credits || credits < 1) {
      return res.status(400).json({ success: false, error: 'Credits must be at least 1' });
    }
    const result = await AdminService.grantTrialCredits(
      req.user!.userId,
      req.params.userId,
      credits,
      reason
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to grant credits' });
  }
});

// Revenue overview
router.get('/revenue', async (req: AuthRequest, res: Response) => {
  try {
    const data = await AdminService.getRevenueOverview();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin revenue error:', error);
    res.status(500).json({ success: false, error: 'Failed to load revenue data' });
  }
});

// Feedback list (admin view)
router.get('/feedback', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const data = await AdminService.getFeedback(page, limit, status);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load feedback' });
  }
});

// Update feedback
router.patch('/feedback/:feedbackId', async (req: AuthRequest, res: Response) => {
  try {
    const { status, admin_notes } = req.body;
    const feedback = await AdminService.updateFeedback(req.params.feedbackId, { status, admin_notes });
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update feedback' });
  }
});

// Send onboarding email (log it)
router.post('/send-onboarding-email', async (req: AuthRequest, res: Response) => {
  try {
    const { recipientUserId, subject, body } = req.body;
    if (!recipientUserId || !subject || !body) {
      return res.status(400).json({ success: false, error: 'recipientUserId, subject, and body are required' });
    }
    const log = await AdminService.logOnboardingEmail(req.user!.userId, recipientUserId, subject, body);
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// Email log
router.get('/email-log', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const data = await AdminService.getEmailLog(page);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load email log' });
  }
});

export default router;
