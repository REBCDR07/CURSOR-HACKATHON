import express from 'express';
import {
  createAccessRequest,
  approveAccessRequest,
  getPatientAccessRequests,
  getDoctorAccessRequests
} from '../controllers/accessController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/request', protect, authorize('doctor'), createAccessRequest);
router.patch('/approve/:id', protect, authorize('patient'), approveAccessRequest);
router.get('/patient', protect, authorize('patient'), getPatientAccessRequests);
router.get('/doctor', protect, authorize('doctor'), getDoctorAccessRequests);

export default router;
