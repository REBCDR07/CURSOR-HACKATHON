import Treatment from '../models/Treatment.js';
import User from '../models/User.js';
import AccessRequest from '../models/AccessRequest.js';

// @desc    Ajouter un traitement / prescrire (Médecin ou Patient lui-même)
// @route   POST /api/treatments
// @access  Privé
const addTreatment = async (req, res) => {
  const {
    patientId,
    nomMedicament,
    posologie,
    frequence,
    heuresPrise,
    duree,
    notes,
    photoOrdonnance
  } = req.body;

  let targetUserId = req.user._id; // Par défaut, le patient lui-même

  // Si c'est un médecin qui prescrit
  if (req.user.role === 'doctor') {
    if (!patientId) {
      return res.status(400).json({ status: 'error', message: 'ID du patient requis' });
    }

    // Vérifier si le médecin a un accès approuvé
    const access = await AccessRequest.findOne({
      patientId,
      doctorId: req.user._id,
      status: 'approved'
    });

    if (!access) {
      return res.status(403).json({ status: 'error', message: 'Vous n\'avez pas accès au dossier de ce patient' });
    }

    targetUserId = patientId;

    // Créer le traitement
    const treatment = await Treatment.create({
      userId: targetUserId,
      prescribedBy: req.user._id, // Enregistre le médecin qui prescrit
      nomMedicament,
      posologie,
      frequence,
      heuresPrise,
      duree,
      notes,
      photoOrdonnance,
    });

    // RÉVOCATION AUTOMATIQUE : L'accès expire après la prescription
    access.status = 'expired';
    await access.save();

    return res.status(201).json({ status: 'success', data: treatment, message: 'Prescription effectuée, accès révoqué' });
  }

  // Si le patient ajoute lui-même son traitement
  const treatment = await Treatment.create({
    userId: targetUserId,
    nomMedicament,
    posologie,
    frequence,
    heuresPrise,
    duree,
    notes,
    photoOrdonnance,
  });

  res.status(201).json({ status: 'success', data: treatment });
};

// @desc    Obtenir les traitements de l'utilisateur connecté (ou d'un patient si médecin autorisé)
// @route   GET /api/treatments
// @access  Privé
const getTreatments = async (req, res) => {
  const { patientId } = req.query;

  let targetUserId = req.user._id;

  if (req.user.role === 'doctor' && patientId) {
    // Vérifier accès approuvé
    const access = await AccessRequest.findOne({
      patientId,
      doctorId: req.user._id,
      status: 'approved'
    });

    if (!access) {
      return res.status(403).json({ status: 'error', message: 'Accès non autorisé au dossier patient' });
    }
    targetUserId = patientId;
  }

  const treatments = await Treatment.find({ userId: targetUserId }).sort('-createdAt');
  res.json({ status: 'success', data: treatments });
};

// @desc    Marquer un traitement comme pris
// @route   PATCH /api/treatments/:id/taken
// @access  Privé (Patient uniquement)
const markAsTaken = async (req, res) => {
  const { heurePriseId } = req.body;
  const treatment = await Treatment.findById(req.params.id);

  if (!treatment) {
    return res.status(404).json({ status: 'error', message: 'Traitement non trouvé' });
  }

  if (treatment.userId.toString() !== req.user._id.toString()) {
    return res.status(401).json({ status: 'error', message: 'Non autorisé' });
  }

  const heurePrise = treatment.heuresPrise.id(heurePriseId);
  if (heurePrise) {
    heurePrise.pris = true;
    heurePrise.datePrise = Date.now();
  }

  // Recalculer l'adhésion
  const totalPrises = treatment.heuresPrise.length;
  if (totalPrises === 0) {
    return res.status(400).json({ status: 'error', message: 'Aucune prise prévue pour ce traitement' });
  }
  const prisesEffectuees = treatment.heuresPrise.filter(h => h.pris).length;
  treatment.adhesion = (prisesEffectuees / totalPrises) * 100;

  await treatment.save();
  res.json({ status: 'success', data: treatment });
};

export { addTreatment, getTreatments, markAsTaken };
