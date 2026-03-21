import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const DEMO_PASSWORD = 'demo123456';

const demos = [
  {
    email: 'kofi@mail.com',
    password: DEMO_PASSWORD,
    role: 'patient',
    pseudo: 'kofi',
    prenom: 'Kofi',
    nom: 'Dupont',
  },
  {
    email: 'arnaud@mail.com',
    password: DEMO_PASSWORD,
    role: 'doctor',
    pseudo: 'dr_arnaud',
    prenom: 'Arnaud',
    nom: 'Martin',
  },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI manquant dans .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  for (const d of demos) {
    const exists = await User.findOne({ email: d.email });
    if (exists) {
      console.log('Déjà présent :', d.email);
      continue;
    }
    await User.create(d);
    console.log('Créé :', d.email, `(${d.role})`);
  }
  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
