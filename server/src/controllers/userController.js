import User from '../models/User.js';
import AccessRequest from '../models/AccessRequest.js';
import Treatment from '../models/Treatment.js';

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/users/profile
// @access  Privé
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json({ status: 'success', data: user });
  } else {
    res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
  }
};

// @desc    Mettre à jour le profil de l'utilisateur connecté
// @route   PUT /api/users/profile
// @access  Privé
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.pseudo = req.body.pseudo || user.pseudo;
    user.age = req.body.age || user.age;
    user.sexe = req.body.sexe || user.sexe;
    user.groupeSanguin = req.body.groupeSanguin || user.groupeSanguin;
    user.electrophorese = req.body.electrophorese || user.electrophorese;
    user.allergies = req.body.allergies || user.allergies;
    user.maladiesChroniques = req.body.maladiesChroniques || user.maladiesChroniques;
    user.taille = req.body.taille || user.taille;
    user.poids = req.body.poids || user.poids;
    user.contactsUrgence = req.body.contactsUrgence || user.contactsUrgence;
    user.consentementDonnees = req.body.consentementDonnees !== undefined ? req.body.consentementDonnees : user.consentementDonnees;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      status: 'success',
      data: {
        _id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        pseudo: updatedUser.pseudo,
      }
    });
  } else {
    res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
  }
};

// @desc    Rechercher un patient par son pseudo (Infos publiques uniquement)
// @route   GET /api/users/search
// @access  Privé (Médecin uniquement)
const searchPatient = async (req, res) => {
  const { pseudo } = req.query;
  const patient = await User.findOne({ pseudo, role: 'patient' }).select('pseudo age sexe');

  if (patient) {
    res.json({ status: 'success', data: patient });
  } else {
    res.status(404).json({ status: 'error', message: 'Patient non trouvé' });
  }
};

// @desc    Obtenir le Dossier Médical complet (Carnet de santé virtuel)
// @route   GET /api/users/dossier
// @access  Privé (Patient ou Médecin autorisé)
const getPatientDossier = async (req, res) => {
  const { patientId } = req.query;
  let targetUserId = req.user._id;

  // Si un médecin demande le dossier
  if (req.user.role === 'doctor') {
    if (!patientId) return res.status(400).json({ status: 'error', message: 'ID du patient requis' });
    
    const access = await AccessRequest.findOne({
      patientId,
      doctorId: req.user._id,
      status: 'approved'
    });

    if (!access) return res.status(403).json({ status: 'error', message: 'Accès au dossier non autorisé' });
    targetUserId = patientId;
  }

  // Récupération de toutes les données liées
  const profile = await User.findById(targetUserId).select('-password');
  const treatments = await Treatment.find({ userId: targetUserId })
    .populate('prescribedBy', 'pseudo email')
    .sort('-createdAt');

  res.json({
    status: 'success',
    data: {
      identite: {
        pseudo: profile.pseudo,
        age: profile.age,
        sexe: profile.sexe,
        taille: profile.taille,
        poids: profile.poids,
      },
      sante: {
        groupeSanguin: profile.groupeSanguin,
        electrophorese: profile.electrophorese,
        allergies: profile.allergies,
        maladiesChroniques: profile.maladiesChroniques,
        vaccins: profile.vaccins,
      },
      historiqueMedical: treatments, // Contient toutes les ordonnances et médicaments
      contactsUrgence: profile.contactsUrgence,
      consentement: profile.consentementDonnees
    }
  });
};

export { getUserProfile, updateUserProfile, searchPatient, getPatientDossier };
