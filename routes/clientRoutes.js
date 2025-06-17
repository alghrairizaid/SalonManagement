const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { ensureAuthenticated, ensureClient } = require('../middleware/auth');

// Apply authentication and client role middleware to all routes
router.use(ensureAuthenticated, ensureClient);

// Client dashboard
router.get('/dashboard', clientController.dashboard);

// Appointment history
router.get('/history', clientController.getAppointmentHistory);
router.get('/appointments/:id', clientController.viewAppointment);
router.get('/appointments/:id/cancel', clientController.cancelAppointment);

// Profile management
router.get('/profile', clientController.getProfile);
router.post('/profile', clientController.updateProfile);

module.exports = router;
