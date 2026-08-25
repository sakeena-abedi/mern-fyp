const express = require('express');
const { createCategory, getCategories, updateCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getCategories).post(authorize('admin'), createCategory);
router.patch('/:id', authorize('admin'), updateCategory);

module.exports = router;
