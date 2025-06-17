const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Apply authentication and admin role middleware to all routes
router.use(ensureAuthenticated, ensureAdmin);

// Admin dashboard
router.get('/dashboard', adminController.dashboard);

// Manicurist management routes
router.get('/manicurists', adminController.getManicurists);
router.get('/manicurists/add', adminController.addManicuristForm);
router.post('/manicurists/add', adminController.addManicurist);
router.get('/manicurists/edit/:id', adminController.editManicuristForm);
router.post('/manicurists/edit/:id', adminController.updateManicurist);
router.get('/manicurists/delete/:id', adminController.deleteManicurist);

// Service management routes
router.get('/services', adminController.getServices);
router.get('/services/add', adminController.addServiceForm);
router.post('/services/add', adminController.addService);
router.get('/services/edit/:id', adminController.editServiceForm);
router.post('/services/edit/:id', adminController.updateService);
router.get('/services/delete/:id', adminController.deleteService);

// Client management routes
router.get('/clients', adminController.getClients);
router.get('/clients/edit/:id', adminController.editClientForm);
router.post('/clients/edit/:id', adminController.updateClient);
router.get('/clients/delete/:id', adminController.deleteClient);

module.exports = router;
