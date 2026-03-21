import express from 'express';
import {
  getPatientDashboard,
  getDoctorDashboard,
  verifyPasswordForAction
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/patient', protect, authorize('patient'), getPatientDashboard);
router.get('/doctor', protect, authorize('doctor'), getDoctorDashboard);
router.post('/verify-password', protect, verifyPasswordForAction);

export default router;
