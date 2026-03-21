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

// Configuration de la sécurité
app.use(helmet());
app.use(cors());

// Middleware pour parser le JSON (limite augmentée pour les photos en base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Route de base
app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API MonCarnet Santé est en ligne' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
