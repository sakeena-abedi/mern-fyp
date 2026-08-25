const express = require('express');
const { getUsers, updateUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.patch('/:id', updateUser);

module.exports = router;
