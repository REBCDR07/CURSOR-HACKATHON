import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// Connexion à MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Le serveur tourne sur le port ${PORT} en mode ${process.env.NODE_ENV || 'production'}`);
});
