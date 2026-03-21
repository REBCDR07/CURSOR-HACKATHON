import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  prenom: {
    type: String,
    required: false,
    trim: true,
  },
  nom: {
    type: String,
    required: false,
    trim: true,
  },
  specialite: {
    type: String,
    required: false,
    trim: true,
  },
  clinique: {
    type: String,
    required: false,
    trim: true,
  },
  role: {
    type: String,
    enum: ['patient', 'doctor'],
    default: 'patient',
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  pseudo: {
    type: String,
    required: false,
    trim: true,
  },
  age: {
    type: Number,
    required: false,
  },
  sexe: {
    type: String,
    enum: ['Homme', 'Femme', 'Autre', 'Non spécifié'],
    default: 'Non spécifié',
  },
  groupeSanguin: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Inconnu'],
    default: 'Inconnu',
  },
  electrophorese: {
    type: String,
    enum: ['AA', 'AS', 'AC', 'SS', 'SC', 'CC', 'Inconnu'],
    default: 'Inconnu',
  },
  allergies: [String],
  maladiesChroniques: [String],
  vaccins: [{
    nom: String,
    date: Date,
  }],
  taille: {
    type: Number, // en cm
  },
  poids: {
    type: Number, // en kg
  },
  contactsUrgence: [{
    nom: String,
    telephone: String,
    relation: String,
  }],
  consentementDonnees: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Hachage du mot de passe avant la sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour comparer les mots de passe
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
