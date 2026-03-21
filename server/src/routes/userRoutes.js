import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  searchPatient,
  getPatientDossier
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/search', protect, authorize('doctor'), searchPatient);
router.get('/dossier', protect, getPatientDossier);

export default router;
