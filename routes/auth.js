const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    console.log('Login attempt received');
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    
    const hashedPassword = process.env.ADMIN_PASSWORD_HASHED;
    
    if (!hashedPassword) {
      console.error('ADMIN_PASSWORD_HASHED not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign(
      { role: 'admin', timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true, 
      token,
      message: 'Login successful' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

// Verify token
router.post('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ valid: false });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.json({ valid: true, role: decoded.role });
  } catch (error) {
    res.json({ valid: false });
  }
});

module.exports = router;