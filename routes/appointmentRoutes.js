const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { ensureAuthenticated, ensureClient, ensureAdmin } = require('../middleware/auth');

// Book appointment form (client only)
router.get('/book', ensureAuthenticated, ensureClient, appointmentController.showBookingForm);

// Get available time slots (AJAX endpoint)
router.get('/available-times', ensureAuthenticated, appointmentController.getAvailableTimeSlots);

// Book appointment (client only)
router.post('/book', ensureAuthenticated, ensureClient, appointmentController.bookAppointment);

// Admin routes
router.get('/', ensureAuthenticated, ensureAdmin, appointmentController.getAllAppointments);
router.get('/:id', ensureAuthenticated, ensureAdmin, appointmentController.viewAppointmentDetails);
router.post('/:id/update', ensureAuthenticated, ensureAdmin, appointmentController.updateAppointment);
router.get('/:id/delete', ensureAuthenticated, ensureAdmin, appointmentController.deleteAppointment);

module.exports = router;
