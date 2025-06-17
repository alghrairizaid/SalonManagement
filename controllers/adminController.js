const User = require('../models/User');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');

// Admin dashboard
exports.dashboard = async (req, res) => {
  try {
    const appointments = await Appointment.getUpcoming();
    const clients = await User.getAllByRole('client');
    const manicurists = await User.getAllByRole('manicurist');
    const services = await Service.getAll();
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.user,
      appointments,
      clientCount: clients.length,
      manicuristCount: manicurists.length,
      serviceCount: services.length
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load dashboard data');
    res.redirect('/');
  }
};

// Manage manicurists
exports.getManicurists = async (req, res) => {
  try {
    const manicurists = await User.getAllByRole('manicurist');
    
    res.render('admin/manicurists', {
      title: 'Manage Manicurists',
      user: req.user,
      manicurists
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load manicurists');
    res.redirect('/admin/dashboard');
  }
};

// Add manicurist form
exports.addManicuristForm = (req, res) => {
  res.render('admin/manicurists', {
    title: 'Add Manicurist',
    user: req.user,
    showAddForm: true
  });
};

// Add manicurist
exports.addManicurist = async (req, res) => {
  const { name, email, password, phone } = req.body;
  let errors = [];

  // Validation
  if (!name || !email || !password) {
    errors.push({ msg: 'Please fill in all required fields' });
  }

  if (password && password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.render('admin/manicurists', {
      title: 'Add Manicurist',
      user: req.user,
      errors,
      showAddForm: true,
      manicuristData: { name, email, phone }
    });
  }

  try {
    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      errors.push({ msg: 'Email is already registered' });
      return res.render('admin/manicurists', {
        title: 'Add Manicurist',
        user: req.user,
        errors,
        showAddForm: true,
        manicuristData: { name, email, phone }
      });
    }

    // Create manicurist
    await User.create({
      name,
      email,
      password,
      phone,
      role: 'manicurist'
    });

    req.flash('success_msg', 'Manicurist added successfully');
    res.redirect('/admin/manicurists');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to add manicurist');
    res.redirect('/admin/manicurists');
  }
};

// Edit manicurist form
exports.editManicuristForm = async (req, res) => {
  try {
    const manicurist = await User.findById(req.params.id);
    
    if (!manicurist || manicurist.role !== 'manicurist') {
      req.flash('error_msg', 'Manicurist not found');
      return res.redirect('/admin/manicurists');
    }
    
    res.render('admin/manicurists', {
      title: 'Edit Manicurist',
      user: req.user,
      showEditForm: true,
      manicurist
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load manicurist data');
    res.redirect('/admin/manicurists');
  }
};

// Update manicurist
exports.updateManicurist = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const id = req.params.id;
  
  try {
    const manicurist = await User.findById(id);
    
    if (!manicurist || manicurist.role !== 'manicurist') {
      req.flash('error_msg', 'Manicurist not found');
      return res.redirect('/admin/manicurists');
    }
    
    // Update user data
    const userData = { name, email, phone };
    
    // Only update password if provided
    if (password && password.length >= 6) {
      userData.password = password;
    }
    
    await User.update(id, userData);
    
    req.flash('success_msg', 'Manicurist updated successfully');
    res.redirect('/admin/manicurists');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to update manicurist');
    res.redirect('/admin/manicurists');
  }
};

// Delete manicurist
exports.deleteManicurist = async (req, res) => {
  try {
    const manicurist = await User.findById(req.params.id);
    
    if (!manicurist || manicurist.role !== 'manicurist') {
      req.flash('error_msg', 'Manicurist not found');
      return res.redirect('/admin/manicurists');
    }
    
    // Check if manicurist has appointments
    const appointments = await Appointment.getByManicurist(req.params.id);
    
    if (appointments && appointments.length > 0) {
      req.flash('error_msg', 'Cannot delete manicurist with existing appointments');
      return res.redirect('/admin/manicurists');
    }
    
    await User.delete(req.params.id);
    
    req.flash('success_msg', 'Manicurist deleted successfully');
    res.redirect('/admin/manicurists');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to delete manicurist');
    res.redirect('/admin/manicurists');
  }
};

// Manage services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.getAll();
    
    res.render('admin/services', {
      title: 'Manage Services',
      user: req.user,
      services
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load services');
    res.redirect('/admin/dashboard');
  }
};

// Add service form
exports.addServiceForm = (req, res) => {
  res.render('admin/services', {
    title: 'Add Service',
    user: req.user,
    showAddForm: true
  });
};

// Add service
exports.addService = async (req, res) => {
  const { name, description, price, duration, image } = req.body;
  let errors = [];

  // Validation
  if (!name || !price || !duration) {
    errors.push({ msg: 'Please fill in all required fields' });
  }

  if (errors.length > 0) {
    return res.render('admin/services', {
      title: 'Add Service',
      user: req.user,
      errors,
      showAddForm: true,
      serviceData: { name, description, price, duration, image }
    });
  }

  try {
    // Create service
    await Service.create({
      name,
      description,
      price: parseFloat(price),
      duration: parseInt(duration),
      image
    });

    req.flash('success_msg', 'Service added successfully');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to add service');
    res.redirect('/admin/services');
  }
};

// Edit service form
exports.editServiceForm = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      req.flash('error_msg', 'Service not found');
      return res.redirect('/admin/services');
    }
    
    res.render('admin/services', {
      title: 'Edit Service',
      user: req.user,
      showEditForm: true,
      service
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load service data');
    res.redirect('/admin/services');
  }
};

// Update service
exports.updateService = async (req, res) => {
  const { name, description, price, duration, image } = req.body;
  const id = req.params.id;
  
  try {
    const service = await Service.findById(id);
    
    if (!service) {
      req.flash('error_msg', 'Service not found');
      return res.redirect('/admin/services');
    }
    
    // Update service data
    await Service.update(id, {
      name,
      description,
      price: parseFloat(price),
      duration: parseInt(duration),
      image
    });
    
    req.flash('success_msg', 'Service updated successfully');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to update service');
    res.redirect('/admin/services');
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      req.flash('error_msg', 'Service not found');
      return res.redirect('/admin/services');
    }
    
    // Check if service has appointments
    const appointments = await Appointment.getAll();
    const hasAppointments = appointments.some(app => app.service_id === parseInt(req.params.id));
    
    if (hasAppointments) {
      req.flash('error_msg', 'Cannot delete service with existing appointments');
      return res.redirect('/admin/services');
    }
    
    await Service.delete(req.params.id);
    
    req.flash('success_msg', 'Service deleted successfully');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to delete service');
    res.redirect('/admin/services');
  }
};

// Clients Management
exports.getClients = async (req, res) => {
  const db = require('../config/database');
  const clients = await db.allAsync('SELECT * FROM users WHERE role = ?', ['client']);
  res.render('admin/clients', { clients });
};

exports.editClientForm = async (req, res) => {
  const db = require('../config/database');
  const client = await db.getAsync('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.render('admin/editClient', { client });
};

exports.updateClient = async (req, res) => {
  const db = require('../config/database');
  const { name, email, phone } = req.body;
  await db.runAsync('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?', [name, email, phone, req.params.id]);
  req.flash('success_msg', 'Client updated successfully');
  res.redirect('/admin/clients');
};

exports.deleteClient = async (req, res) => {
  const db = require('../config/database');
  await db.runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
  req.flash('success_msg', 'Client deleted successfully');
  res.redirect('/admin/clients');
};
