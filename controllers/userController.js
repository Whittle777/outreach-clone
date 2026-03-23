const userService = require('../services/userService');

// Create a new user
async function createUser(req, res) {
  const { email, password, bento } = req.body;
  try {
    const user = await userService.registerUser(email, password, bento);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
}

// Get all users
async function getAllUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
}

// Get a single user by ID
async function getUserById(req, res) {
  const { id } = req.params;
  try {
    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
}

// Update a user by ID
async function updateUser(req, res) {
  const { id } = req.params;
  const { email, password, bento } = req.body;
  try {
    const updatedUser = await userService.updateUser(id, email, password, bento);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
}

// Delete a user by ID
async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    const deletedUser = await userService.deleteUser(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
