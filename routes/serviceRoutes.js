const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Get all services
router.get('/', serviceController.getAllServices);

// Get service details
router.get('/:id', serviceController.getServiceDetails);

module.exports = router;
