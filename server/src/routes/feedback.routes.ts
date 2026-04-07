import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { DataService } from '../services/data.service';

const router = Router();

// All feedback routes require authentication
router.use(authMiddleware);

// Submit feedback (customer-facing)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, rating, subject, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    const feedback = await DataService.insertOne('feedback', {
      user_id: req.user!.userId,
      type: type || 'general',
      rating: rating || null,
      subject: subject || null,
      message: message.trim(),
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    console.error('Feedback submit error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit feedback' });
  }
});

// Get my feedback history
router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const feedback = await DataService.findMany(
      'SELECT * FROM feedback WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user!.userId]
    );
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load feedback' });
  }
});

export default router;
