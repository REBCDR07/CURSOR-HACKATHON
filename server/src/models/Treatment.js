import mongoose from 'mongoose';

const treatmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Sera rempli si c'est un médecin qui prescrit
  },
  nomMedicament: {
    type: String,
    required: true,
    trim: true,
  },
  posologie: {
    type: String,
    required: true,
  },
  frequence: {
    type: String, // ex: "1x/jour", "2x/jour"
    required: true,
  },
  heuresPrise: [{
    heure: String, // ex: "20:00"
    pris: {
      type: Boolean,
      default: false,
    },
    datePrise: Date,
  }],
  duree: {
    type: Number, // en jours
    required: true,
  },
  notes: {
    type: String,
  },
  photoOrdonnance: {
    type: String, // Stockage base64
    required: false,
  },
  actif: {
    type: Boolean,
    default: true,
  },
  dateDebut: {
    type: Date,
    default: Date.now,
  },
  adhesion: {
    type: Number, // % de prises effectuées sur le total prévu
    default: 0,
  },
}, {
  timestamps: true,
});

const Treatment = mongoose.model('Treatment', treatmentSchema);
export default Treatment;
