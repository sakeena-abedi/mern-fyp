const Ticket = require('../models/Ticket');
const StatusHistory = require('../models/StatusHistory');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const generateTicketNumber = require('../utils/ticketNumber');
const { asyncHandler } = require('../middleware/errorHandler');

const VALID_TRANSITIONS = {
  Open: ['Assigned', 'In Progress'],
  Assigned: ['In Progress', 'Open'],
  'In Progress': ['Resolved', 'Assigned'],
  Resolved: ['Closed', 'In Progress'], // reopen
  Closed: ['In Progress'], // reopen
};

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private (requester, agent, admin can all log a ticket)
const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority, screenshotUrl } = req.body;

  if (!title || !description || !category) {
    res.status(400);
    throw new Error('Title, description, and category are required');
  }

  const categoryDoc = await Category.findById(category);
  if (!categoryDoc || !categoryDoc.isActive) {
    res.status(400);
    throw new Error('Selected category is invalid or inactive');
  }

  const ticketNo = await generateTicketNumber();

  const ticket = await Ticket.create({
    ticketNo,
    title,
    description,
    category,
    priority,
    screenshotUrl,
    requester: req.user._id,
    status: 'Open',
  });

  await StatusHistory.create({
    ticket: ticket._id,
    changedBy: req.user._id,
    fromStatus: null,
    toStatus: 'Open',
    note: 'Ticket created',
  });

  res.status(201).json({ success: true, data: ticket });
});

// @desc    Get tickets (scoped by role) with filters, search, pagination
// @route   GET /api/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const { search, category, priority, status, agent, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

  const query = {};

  // Role-based scoping
  if (req.user.role === 'requester') {
    query.requester = req.user._id;
  } else if (req.user.role === 'agent') {
    query.assignedAgent = req.user._id;
  }
  // admin sees everything unless they filter explicitly

  if (search) {
    query.$or = [
      { ticketNo: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (status) query.status = status;
  if (agent && req.user.role === 'admin') query.assignedAgent = agent;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
  const skip = (pageNum - 1) * limitNum;

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .populate('category', 'name')
      .populate('requester', 'name email')
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Ticket.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: tickets.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: tickets,
  });
});

// Helper: does the current user have access to view/modify this ticket?
const canAccessTicket = (user, ticket) => {
  if (user.role === 'admin') return true;
  if (user.role === 'requester') return ticket.requester.toString() === user._id.toString();
  if (user.role === 'agent') return ticket.assignedAgent && ticket.assignedAgent.toString() === user._id.toString();
  return false;
};

// @desc    Get single ticket by id
// @route   GET /api/tickets/:id
// @access  Private (owner requester, assigned agent, or admin)
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('category', 'name')
    .populate('requester', 'name email')
    .populate('assignedAgent', 'name email');

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (!canAccessTicket(req.user, ticket)) {
    res.status(403);
    throw new Error('You do not have permission to view this ticket');
  }

  res.status(200).json({ success: true, data: ticket });
});

// @desc    Update ticket general fields (title, description, priority, category)
// @route   PATCH /api/tickets/:id
// @access  Private (requester who owns it while Open, or admin)
const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  const isOwner = ticket.requester.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('You do not have permission to update this ticket');
  }
  if (isOwner && !isAdmin && ticket.status !== 'Open') {
    res.status(400);
    throw new Error('Ticket can only be edited by the requester while it is Open');
  }

  const editableFields = ['title', 'description', 'category', 'priority', 'screenshotUrl'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) ticket[field] = req.body[field];
  });

  await ticket.save();
  res.status(200).json({ success: true, data: ticket });
});

// @desc    Assign or reassign a ticket to an agent
// @route   PATCH /api/tickets/:id/assign
// @access  Private/Admin
const assignTicket = asyncHandler(async (req, res) => {
  const { agentId } = req.body;
  if (!agentId) {
    res.status(400);
    throw new Error('agentId is required');
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (['Resolved', 'Closed'].includes(ticket.status)) {
    res.status(400);
    throw new Error('Cannot reassign a resolved or closed ticket');
  }

  const previousStatus = ticket.status;
  ticket.assignedAgent = agentId;
  ticket.status = 'Assigned';
  await ticket.save();

  await StatusHistory.create({
    ticket: ticket._id,
    changedBy: req.user._id,
    fromStatus: previousStatus,
    toStatus: 'Assigned',
    note: `Assigned to agent ${agentId}`,
  });

  res.status(200).json({ success: true, data: ticket });
});

// @desc    Update ticket status (follows workflow rules)
// @route   PATCH /api/tickets/:id/status
// @access  Private (assigned agent or admin)
const updateStatus = asyncHandler(async (req, res) => {
  const { status, note, resolution } = req.body;
  if (!status) {
    res.status(400);
    throw new Error('New status is required');
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  const isAssignedAgent =
    req.user.role === 'agent' && ticket.assignedAgent && ticket.assignedAgent.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const isRequesterReopening =
    req.user.role === 'requester' &&
    ticket.requester.toString() === req.user._id.toString() &&
    ticket.status === 'Resolved' &&
    status === 'In Progress';

  if (!isAssignedAgent && !isAdmin && !isRequesterReopening) {
    res.status(403);
    throw new Error('You do not have permission to change this ticket status');
  }

  const allowedNext = VALID_TRANSITIONS[ticket.status] || [];
  if (!allowedNext.includes(status)) {
    res.status(400);
    throw new Error(`Cannot move ticket from '${ticket.status}' to '${status}'`);
  }

  if (status === 'Resolved' && !resolution && !ticket.resolution) {
    res.status(400);
    throw new Error('A resolution note is required to mark a ticket as Resolved');
  }

  const previousStatus = ticket.status;
  ticket.status = status;
  if (resolution) ticket.resolution = resolution;
  await ticket.save();

  await StatusHistory.create({
    ticket: ticket._id,
    changedBy: req.user._id,
    fromStatus: previousStatus,
    toStatus: status,
    note: note || '',
  });

  res.status(200).json({ success: true, data: ticket });
});

// @desc    Get status history for a ticket
// @route   GET /api/tickets/:id/history
// @access  Private (same access rules as the ticket)
const getStatusHistory = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (!canAccessTicket(req.user, ticket)) {
    res.status(403);
    throw new Error('You do not have permission to view this ticket history');
  }

  const history = await StatusHistory.find({ ticket: ticket._id })
    .populate('changedBy', 'name role')
    .sort({ createdAt: 1 });

  res.status(200).json({ success: true, data: history });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  updateStatus,
  getStatusHistory,
  canAccessTicket,
};
