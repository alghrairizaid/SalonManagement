const Auth = require('../config/auth');

// التحقق من تسجيل الدخول
const ensureAuthenticated = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      req.flash('error_msg', 'Please log in to access this page');
      return res.redirect('/login');
    }

    const user = await Auth.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      req.flash('error_msg', 'Invalid session, please log in again');
      return res.redirect('/login');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    req.flash('error_msg', 'An error occurred while verifying the session');
    res.redirect('/login');
  }
};

// التحقق من صلاحيات الإدارة
const ensureAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  req.flash('error_msg', 'You are not authorized to access this page');
  res.redirect('/');
};

// التحقق من صلاحيات المصمم
const ensureManicurist = (req, res, next) => {
  if (req.user && req.user.role === 'manicurist') {
    return next();
  }
  req.flash('error_msg', 'You are not authorized to access this page');
  res.redirect('/');
};

// التحقق من صلاحيات العميل
const ensureClient = (req, res, next) => {
  if (req.user && req.user.role === 'client') {
    return next();
  }
  req.flash('error_msg', 'You are not authorized to access this page');
  res.redirect('/');
};

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  ensureManicurist,
  ensureClient
};
