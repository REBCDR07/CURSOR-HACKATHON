import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Enregistrer un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, password, role, pseudo, prenom, nom } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'L\'utilisateur existe déjà' });
    }

    const user = await User.create({
      email,
      password,
      role: role || 'patient',
      pseudo,
      prenom,
      nom,
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        _id: user._id,
        email: user.email,
        role: user.role,
        pseudo: user.pseudo,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ status: 'error', message: 'Données utilisateur invalides' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Authentifier un utilisateur & obtenir un token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email et mot de passe requis',
      });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      return res.json({
        status: 'success',
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }

    return res.status(401).json({ status: 'error', message: 'Email ou mot de passe invalide' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export { registerUser, loginUser };
