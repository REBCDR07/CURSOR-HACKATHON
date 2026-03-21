import User from '../models/User.js';
import Treatment from '../models/Treatment.js';
import AccessRequest from '../models/AccessRequest.js';

// @desc    Obtenir les statistiques et widgets du Dashboard Patient
// @route   GET /api/dashboard/patient
// @access  Privé (Patient uniquement)
const getPatientDashboard = async (req, res) => {
  const userId = req.user._id;

  // 1. Demandes d'accès en attente (Notifications)
  const pendingRequests = await AccessRequest.find({ patientId: userId, status: 'pending' })
    .populate('doctorId', 'pseudo email');

  // 2. Traitements du jour
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const treatments = await Treatment.find({ userId: userId, actif: true });
  // On filtre manuellement les prises prévues "aujourd'hui" si nécessaire,
  // mais ici on renvoie les traitements actifs pour affichage simple.

  // 3. Calcul du Taux d'Adhésion Mensuel
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let totalPrescribed = 0;
  let totalTaken = 0;

  treatments.forEach(t => {
    t.heuresPrise.forEach(h => {
      // On compte les prises prévues depuis le début du mois
      // (Simplification : on regarde la date de création ou début du traitement)
      totalPrescribed++;
      if (h.pris) totalTaken++;
    });
  });

  const adhesionRate = totalPrescribed > 0 ? Math.round((totalTaken / totalPrescribed) * 100) : 100;

  // 4. Ordonnances récentes (3 dernières)
  const recentPrescriptions = await Treatment.find({ userId: userId })
    .sort('-createdAt')
    .limit(3);

  res.json({
    status: 'success',
    data: {
      user: {
        pseudo: req.user.pseudo,
        age: req.user.age,
        groupeSanguin: req.user.groupeSanguin,
      },
      widgets: {
        adhesionRate: `${adhesionRate}%`,
        pendingRequestsCount: pendingRequests.length,
        todayTreatmentsCount: treatments.length,
      },
      notifications: pendingRequests,
      recentPrescriptions,
      treatments
    }
  });
};

// @desc    Obtenir le Dashboard Médecin
// @route   GET /api/dashboard/doctor
// @access  Privé (Médecin uniquement)
const getDoctorDashboard = async (req, res) => {
  // Liste des patients auxquels le médecin a actuellement accès
  const approvedAccess = await AccessRequest.find({ doctorId: req.user._id, status: 'approved' })
    .populate('patientId', 'pseudo age sexe');

  // Liste des demandes envoyées en attente
  const pendingRequestsSent = await AccessRequest.find({ doctorId: req.user._id, status: 'pending' })
    .populate('patientId', 'pseudo age sexe');

  res.json({
    status: 'success',
    data: {
      doctor: { pseudo: req.user.pseudo },
      activePatients: approvedAccess,
      pendingRequestsSent
    }
  });
};

// @desc    Vérifier le mot de passe (pour actions sensibles comme l'export PDF)
// @route   POST /api/dashboard/verify-password
// @access  Privé
const verifyPasswordForAction = async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id);

  if (user && (await user.matchPassword(password))) {
    res.json({ status: 'success', message: 'Mot de passe vérifié' });
  } else {
    res.status(401).json({ status: 'error', message: 'Mot de passe incorrect' });
  }
};

export { getPatientDashboard, getDoctorDashboard, verifyPasswordForAction };
