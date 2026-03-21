import express from 'express';
import {
  addTreatment,
  getTreatments,
  markAsTaken
} from '../controllers/treatmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addTreatment);
router.get('/', protect, getTreatments);
router.patch('/:id/taken', protect, markAsTaken);

export default router;
