const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const { asyncHandler } = require('../middleware/errorHandler');
const { canAccessTicket } = require('./ticketController');

// @desc    Add a comment to a ticket
// @route   POST /api/tickets/:id/comments
// @access  Private (requester who owns it, assigned agent, or admin)
const addComment = asyncHandler(async (req, res) => {
  const { message, isInternal } = req.body;
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('Comment message is required');
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (!canAccessTicket(req.user, ticket)) {
    res.status(403);
    throw new Error('You do not have permission to comment on this ticket');
  }
  if (ticket.status === 'Closed') {
    res.status(400);
    throw new Error('Closed tickets cannot receive comments. Reopen the ticket first.');
  }

  // Only agents/admins may mark a comment internal
  const internalFlag = req.user.role !== 'requester' && Boolean(isInternal);

  const comment = await Comment.create({
    ticket: ticket._id,
    author: req.user._id,
    message: message.trim(),
    isInternal: internalFlag,
  });

  const populated = await comment.populate('author', 'name role');
  res.status(201).json({ success: true, data: populated });
});

// @desc    Get comments for a ticket
// @route   GET /api/tickets/:id/comments
// @access  Private (same access rules as the ticket)
const getComments = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (!canAccessTicket(req.user, ticket)) {
    res.status(403);
    throw new Error('You do not have permission to view comments on this ticket');
  }

  const filter = { ticket: ticket._id };
  // Requesters never see internal agent/admin notes
  if (req.user.role === 'requester') filter.isInternal = false;

  const comments = await Comment.find(filter).populate('author', 'name role').sort({ createdAt: 1 });

  res.status(200).json({ success: true, count: comments.length, data: comments });
});

module.exports = { addComment, getComments };
