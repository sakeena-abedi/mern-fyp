const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    List users (optionally filter by role), e.g. to populate agent dropdown
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).select('-password').sort({ name: 1 });
  res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc    Activate/deactivate a user or change their role
// @route   PATCH /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { isActive, role } = req.body;
  if (isActive !== undefined) user.isActive = isActive;
  if (role && ['requester', 'agent', 'admin'].includes(role)) user.role = role;

  await user.save();
  res.status(200).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
});

module.exports = { getUsers, updateUser };
