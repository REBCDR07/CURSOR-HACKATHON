import AccessRequest from '../models/AccessRequest.js';
import User from '../models/User.js';

// @desc    Créer une demande d'accès (Médecin vers Patient)
// @route   POST /api/access/request
// @access  Privé (Médecin uniquement)
const createAccessRequest = async (req, res) => {
  const { patientPseudo } = req.body;

  const patient = await User.findOne({ pseudo: patientPseudo, role: 'patient' });

  if (!patient) {
    return res.status(404).json({ status: 'error', message: 'Patient non trouvé' });
  }

  const existingRequest = await AccessRequest.findOne({
    patientId: patient._id,
    doctorId: req.user._id,
    status: { $in: ['pending', 'approved'] }
  });

  if (existingRequest) {
    return res.status(400).json({ status: 'error', message: 'Une demande est déjà en cours ou approuvée' });
  }

  const request = await AccessRequest.create({
    patientId: patient._id,
    doctorId: req.user._id,
  });

  res.status(201).json({ status: 'success', data: request });
};

// @desc    Approuver une demande d'accès
// @route   PATCH /api/access/approve/:id
// @access  Privé (Patient uniquement)
const approveAccessRequest = async (req, res) => {
  const request = await AccessRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).json({ status: 'error', message: 'Demande non trouvée' });
  }

  if (request.patientId.toString() !== req.user._id.toString()) {
    return res.status(401).json({ status: 'error', message: 'Non autorisé' });
  }

  request.status = 'approved';
  await request.save();

  res.json({ status: 'success', message: 'Accès approuvé' });
};

// @desc    Obtenir les demandes d'accès d'un patient
// @route   GET /api/access/patient
// @access  Privé (Patient uniquement)
const getPatientAccessRequests = async (req, res) => {
  const requests = await AccessRequest.find({ patientId: req.user._id, status: 'pending' })
    .populate('doctorId', 'pseudo email');

  res.json({ status: 'success', data: requests });
};

// @desc    Obtenir les demandes d'accès envoyées par un médecin
// @route   GET /api/access/doctor
// @access  Privé (Médecin uniquement)
const getDoctorAccessRequests = async (req, res) => {
  const requests = await AccessRequest.find({ doctorId: req.user._id })
    .populate('patientId', 'pseudo email');

  res.json({ status: 'success', data: requests });
};

export { createAccessRequest, approveAccessRequest, getPatientAccessRequests, getDoctorAccessRequests };
