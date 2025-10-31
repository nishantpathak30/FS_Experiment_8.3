// server.js
const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const verifyToken = require('./middleware/authMiddleware');
const authorizeRoles = require('./middleware/roleMiddleware');

dotenv.config();

const app = express();
app.use(express.json());

// Hardcoded users for demo (in real apps, use database)
const users = [
  { id: 1, username: 'adminUser', password: 'admin123', role: 'Admin' },
  { id: 2, username: 'modUser', password: 'mod123', role: 'Moderator' },
  { id: 3, username: 'normalUser', password: 'user123', role: 'User' },
];

// Login route — issues JWT token with role
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const foundUser = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!foundUser) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: foundUser.id, username: foundUser.username, role: foundUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    message: 'Login successful',
    token,
    role: foundUser.role,
  });
});

// 🧠 Protected routes with role restrictions

// Accessible to all authenticated users
app.get('/profile', verifyToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.username}, this is your user profile.`,
    role: req.user.role,
  });
});

// Only Admins
app.get('/admin/dashboard', verifyToken, authorizeRoles('Admin'), (req, res) => {
  res.json({
    message: 'Welcome to the Admin Dashboard!',
    user: req.user,
  });
});

// Only Moderators
app.get('/moderator/manage', verifyToken, authorizeRoles('Moderator'), (req, res) => {
  res.json({
    message: 'Moderator access granted! You can manage content here.',
    user: req.user,
  });
});

// Admin and Moderator
app.get('/shared-panel', verifyToken, authorizeRoles('Admin', 'Moderator'), (req, res) => {
  res.json({
    message: `Shared panel for Admins and Moderators. Hello ${req.user.username}!`,
  });
});

// Default public route
app.get('/', (req, res) => {
  res.send('Welcome! Please login to access protected routes.');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
