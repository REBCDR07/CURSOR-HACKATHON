import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import accessRoutes from './routes/accessRoutes.js';
import treatmentRoutes from './routes/treatmentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const app = express();

// 1. CONFIGURATION CORS PRÉCISE (Crucial pour Render/Vercel)
app.use(cors({
  origin: 'https://healthpocket-frontend.onrender.com', // Ton URL de front
  credentials: true
}));

// Configuration de la sécurité (Helmet peut bloquer certaines images si mal réglé)
app.use(helmet({
  crossOriginResourcePolicy: false, // Permet l'affichage des images base64 si besoin
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API MonCarnet Santé est en ligne' });
});

// 2. ÉCOUTE DU PORT (Indispensable pour Render)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message
  });
});

export default app;
