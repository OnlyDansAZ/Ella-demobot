
import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/user', (req: Request, res: Response) => {
  const userId = req.headers['x-replit-user-id'];
  const userName = req.headers['x-replit-user-name'];
  
  if (!userId || !userName) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    id: userId,
    name: userName
  });
});

export default router;
