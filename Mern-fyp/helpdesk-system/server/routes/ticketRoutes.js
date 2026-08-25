const express = require('express');
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  updateStatus,
  getStatusHistory,
} = require('../controllers/ticketController');
const { addComment, getComments } = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').post(createTicket).get(getTickets);
router.route('/:id').get(getTicketById).patch(updateTicket);

router.patch('/:id/assign', authorize('admin'), assignTicket);
router.patch('/:id/status', updateStatus);
router.get('/:id/history', getStatusHistory);

router.route('/:id/comments').get(getComments).post(addComment);

module.exports = router;
