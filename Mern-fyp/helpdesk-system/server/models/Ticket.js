const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketNo: { type: String, required: true, unique: true },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    screenshotUrl: { type: String, default: '' },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    resolution: { type: String, default: '' },
  },
  { timestamps: true }
);

// Indexes for common search/filter fields
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ requester: 1 });
ticketSchema.index({ assignedAgent: 1 });
ticketSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Ticket', ticketSchema);
