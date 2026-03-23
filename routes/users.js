const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// User registration
router.post('/', userController.createUser);

// Get all users (protected)
router.get('/', authenticateToken, userController.getAllUsers);

// Get single user by ID (protected)
router.get('/:id', authenticateToken, userController.getUserById);

// Update user by ID (protected)
router.put('/:id', authenticateToken, userController.updateUser);

// Delete user by ID (protected)
router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router;
