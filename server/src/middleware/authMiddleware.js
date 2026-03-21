import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Utilisateur non trouvé' });
      }
      next();
    } catch (error) {
      res.status(401).json({ status: 'error', message: 'Non autorisé, token invalide' });
    }
  }

  if (!token) {
    res.status(401).json({ status: 'error', message: 'Non autorisé, pas de token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette route`,
      });
    }
    next();
  };
};

export { protect, authorize };
