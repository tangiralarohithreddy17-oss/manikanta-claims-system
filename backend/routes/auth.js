const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'manikanta_secret_key_123!';

// Login Endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase().trim()]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Sign Token
    const payload = {
      username: user.username,
      role: user.role,
      name: user.name
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            username: user.username,
            role: user.role,
            name: user.name
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Current User Profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT username, role, name, created_at FROM users WHERE username = $1', [req.user.username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage Staff: Get all users (restricted to admin ONLY)
router.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Only admins can view staff directory' });
  }

  try {
    const result = await db.query('SELECT username, name, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
});

// Manage Staff: Create a new user (restricted to admin ONLY)
router.post('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Only admins can create staff accounts' });
  }

  const { username, name, role, password } = req.body;

  if (!username || !name || !role || !password) {
    return res.status(400).json({ message: 'Please provide all required user details' });
  }

  try {
    const checkUser = await db.query('SELECT username FROM users WHERE username = $1', [username.toLowerCase().trim()]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, name, role, password) VALUES ($1, $2, $3, $4)',
      [username.toLowerCase().trim(), name, role, hashedPassword]
    );

    res.status(201).json({ message: 'User account created successfully' });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Server error creating user' });
  }
});

// Manage Staff: Delete a user (restricted to admin ONLY)
router.delete('/users/:username', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Only admins can delete user accounts' });
  }

  const usernameToDelete = req.params.username.toLowerCase().trim();

  // Prevent self-deletion
  if (req.user.username.toLowerCase() === usernameToDelete) {
    return res.status(400).json({ message: 'Self-deletion is not allowed' });
  }

  try {
    const checkUser = await db.query('SELECT username FROM users WHERE username = $1', [usernameToDelete]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await db.query('DELETE FROM users WHERE username = $1', [usernameToDelete]);
    res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// Update profile credentials (username and password)
router.put('/profile', authMiddleware, async (req, res) => {
  const { username: newUsername, password: newPassword, name: newName } = req.body;
  const currentUsername = req.user.username;

  if (!newUsername) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    // If username is changing, ensure it is not taken
    if (newUsername.toLowerCase().trim() !== currentUsername.toLowerCase()) {
      const checkUser = await db.query('SELECT username FROM users WHERE username = $1', [newUsername.toLowerCase().trim()]);
      if (checkUser.rows.length > 0) {
        return res.status(400).json({ message: 'Username is already in use by another account' });
      }
    }

    let queryStr = 'UPDATE users SET username = $1';
    const params = [newUsername.toLowerCase().trim()];
    let paramCount = 2;

    if (newPassword && newPassword.trim() !== '') {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      queryStr += `, password = $${paramCount}`;
      params.push(hashedPassword);
      paramCount++;
    }

    if (newName) {
      queryStr += `, name = $${paramCount}`;
      params.push(newName);
      paramCount++;
    }

    queryStr += ` WHERE username = $${paramCount}`;
    params.push(currentUsername);

    await db.query(queryStr, params);

    // Fetch updated user information
    const userResult = await db.query('SELECT username, role, name FROM users WHERE username = $1', [newUsername.toLowerCase().trim()]);
    const updatedUser = userResult.rows[0];

    const payload = {
      username: updatedUser.username,
      role: updatedUser.role,
      name: updatedUser.name
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          message: 'Profile updated successfully',
          token,
          user: {
            username: updatedUser.username,
            role: updatedUser.role,
            name: updatedUser.name
          }
        });
      }
    );
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error updating profile settings' });
  }
});

module.exports = router;
