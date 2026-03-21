import mongoose from 'mongoose';

const accessRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'expired'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Expire automatiquement après 24h si pas traitée
  }
}, {
  timestamps: true,
});

const AccessRequest = mongoose.model('AccessRequest', accessRequestSchema);
export default AccessRequest;
