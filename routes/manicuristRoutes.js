const express = require('express');
const router = express.Router();
const manicuristController = require('../controllers/manicuristController');
const { ensureAuthenticated, ensureManicurist } = require('../middleware/auth');

// Apply authentication and manicurist role middleware to all routes
router.use(ensureAuthenticated, ensureManicurist);

// Manicurist dashboard
router.get('/dashboard', manicuristController.dashboard);

// Appointment management
router.get('/appointments', manicuristController.getAppointments);
router.get('/appointments/:id', manicuristController.viewAppointment);
router.post('/appointments/:id/update', manicuristController.updateAppointmentStatus);

// Profile management
router.get('/profile', manicuristController.getProfile);
router.post('/profile', manicuristController.updateProfile);

module.exports = router;
