const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/auth');

// Login page
router.get('/login', authController.showLogin);

// Register page
router.get('/register', authController.showRegister);

// Register handle
router.post('/register', authController.register);

// Login handle
router.post('/login', authController.login);

// Logout handle
router.get('/logout', ensureAuthenticated, authController.logout);

// Redirect based on role
router.get('/auth/redirect', ensureAuthenticated, authController.redirect);

module.exports = router;
