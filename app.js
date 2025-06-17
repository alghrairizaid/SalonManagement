const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const SQLiteStore = require('connect-sqlite3')(session);

// Initialize database
const db = require('./config/database');

// Initialize app
const app = express();

// Set up view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  store: new SQLiteStore({ 
    db: 'sessions.db', 
    dir: './config'
  }),
  secret: 'manicuresalonsecret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: false,
    httpOnly: true
  }
}));

// Connect flash
app.use(flash());

// Global variables
app.use(async (req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  
  // تحميل بيانات المستخدم إذا كان مسجل الدخول
  if (req.session.userId) {
    try {
      const Auth = require('./config/auth');
      const user = await Auth.findById(req.session.userId);
      res.locals.user = user;
      req.user = user;
    } catch (error) {
      console.error('Error loading user:', error);
      res.locals.user = null;
      req.user = null;
    }
  } else {
    res.locals.user = null;
    req.user = null;
  }
  
  next();
});

// Routes
app.use('/', require('./routes/authRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/manicurist', require('./routes/manicuristRoutes'));
app.use('/client', require('./routes/clientRoutes'));
app.use('/services', require('./routes/serviceRoutes'));
app.use('/appointments', require('./routes/appointmentRoutes'));

// Home route
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Manicure Salon',
    user: req.user
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: { status: 404 }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('error', {
    title: err.status ? `Error ${err.status}` : 'Server Error',
    message: err.message,
    error: err
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
