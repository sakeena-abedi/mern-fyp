const Ticket = require('../models/Ticket');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get dashboard summary stats, scoped by role
// @route   GET /api/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res) => {
  const baseFilter = {};
  if (req.user.role === 'requester') baseFilter.requester = req.user._id;
  if (req.user.role === 'agent') baseFilter.assignedAgent = req.user._id;

  const now = new Date();

  const [total, open, resolved, overdue, byPriority, byStatus, recent] = await Promise.all([
    Ticket.countDocuments(baseFilter),
    Ticket.countDocuments({ ...baseFilter, status: { $in: ['Open', 'Assigned', 'In Progress'] } }),
    Ticket.countDocuments({ ...baseFilter, status: 'Resolved' }),
    Ticket.countDocuments({
      ...baseFilter,
      dueDate: { $ne: null, $lt: now },
      status: { $nin: ['Resolved', 'Closed'] },
    }),
    Ticket.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Ticket.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Ticket.find(baseFilter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('ticketNo title status priority updatedAt')
      .populate('requester', 'name')
      .populate('assignedAgent', 'name'),
  ]);

  res.status(200).json({
    success: true,
    data: {
      cards: { total, open, resolved, overdue },
      byPriority,
      byStatus,
      recentActivity: recent,
    },
  });
});

module.exports = { getDashboard };
