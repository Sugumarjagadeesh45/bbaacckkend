// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const AdminUser = require('../models/adminUser');
const jwt = require('jsonwebtoken');

// ================================
// TEMPORARY DEBUG ROUTES (Remove after debugging)
// ================================

// List all admin users
router.get('/admin-users', async (req, res) => {
  try {
    const adminUsers = await AdminUser.find().select('-passwordHash');
    console.log('📋 Found admin users:', adminUsers);
    res.json({
      count: adminUsers.length,
      users: adminUsers
    });
  } catch (err) {
    console.error('❌ Error fetching admin users:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create admin user
router.post('/create-admin', async (req, res) => {
  try {
    const { username, password, role = 'admin' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const existingAdmin = await AdminUser.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }
    
    const admin = new AdminUser({
      username,
      role
    });
    
    await admin.setPassword(password);
    await admin.save();
    
    console.log('✅ Admin user created:', username);
    
    res.json({ 
      success: true,
      message: 'Admin user created successfully',
      username,
      role 
    });
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// EXISTING ROUTES
// ================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', { email, password });
    
    // Find admin user by username (using email as username)
    const admin = await AdminUser.findOne({ username: email });
    console.log('👤 Found admin:', admin ? 'Yes' : 'No');
    
    if (!admin) {
      console.log('❌ Admin not found with username:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await admin.validatePassword(password);
    console.log('🔑 Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for admin:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: admin.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', admin.username);
    
    res.json({
      token,
      role: admin.role,
      message: 'Login successful'
    });
  } catch (err) {
    console.error('❌ Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ... rest of your existing routes ...
router.get('/driver-status', (req, res) => {
  try {
    const drivers = Array.from(activeDriverSockets.values()).map(driver => ({
      driverId: driver.driverId,
      driverName: driver.driverName,
      status: driver.status,
      vehicleType: driver.vehicleType,
      location: driver.location,
      lastUpdate: driver.lastUpdate,
      socketId: driver.socketId
    }));

    res.json({
      totalDrivers: drivers.length,
      drivers: drivers
    });
  } catch (err) {
    console.error('Error fetching driver status:', err);
    res.status(500).json({ error: 'Failed to fetch driver status' });
  }
});

// Get current ride status
router.get('/ride-status', (req, res) => {
  try {
    const ridesList = Object.entries(rides).map(([rideId, ride]) => ({
      rideId,
      status: ride.status,
      userId: ride.userId,
      driverId: ride.driverId,
      driverName: ride.driverName,
      pickup: ride.pickup,
      drop: ride.drop,
      vehicleType: ride.vehicleType,
      timestamp: ride.timestamp,
      acceptedAt: ride.acceptedAt,
      completedAt: ride.completedAt
    }));

    res.json({
      totalRides: ridesList.length,
      rides: ridesList
    });
  } catch (err) {
    console.error('Error fetching ride status:', err);
    res.status(500).json({ error: 'Failed to fetch ride status' });
  }
});

// ================================
// Admin Controller Routes
// ================================

// User & Driver Management
router.get('/dashboard-data', adminController.getDashboardData);
router.get('/users', adminController.getUsers);
router.get('/drivers', adminController.getDrivers);
router.put('/driver/:id/toggle', adminController.toggleDriverStatus);

// Rides
router.get('/rides', adminController.getRides);
router.post('/ride/:rideId/assign', adminController.assignRide);

// Points & Stock
router.post('/user/:id/adjust-points', adminController.adjustUserPoints);
router.post('/grocery/adjust-stock', adminController.adjustGroceryStock);

module.exports = router;











// // routes/adminRoutes.js
// const express = require('express');
// const router = express.Router();
// const adminController = require('../controllers/adminController');

// // User & Driver Management
// router.get('/dashboard-data', adminController.getDashboardData);
// router.get('/users', adminController.getUsers);
// router.get('/drivers', adminController.getDrivers);
// router.put('/driver/:id/toggle', adminController.toggleDriverStatus);

// // Rides
// router.get('/rides', adminController.getRides);
// router.post('/ride/:rideId/assign', adminController.assignRide);

// // Points & Stock
// router.post('/user/:id/adjust-points', adminController.adjustUserPoints);
// router.post('/grocery/adjust-stock', adminController.adjustGroceryStock);

// module.exports = router;
