// Seeds demo users, categories, and a couple of sample tickets.
// Run with: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Category = require('./models/Category');
const Ticket = require('./models/Ticket');
const Comment = require('./models/Comment');
const StatusHistory = require('./models/StatusHistory');

const seed = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Ticket.deleteMany({}),
    Comment.deleteMany({}),
    StatusHistory.deleteMany({}),
  ]);

  console.log('Creating demo users...');
  // Passwords are hashed automatically via the User model's pre-save hook
  const admin = await User.create({ name: 'Ava Admin', email: 'admin@demo.com', password: 'password123', role: 'admin' });
  const agent1 = await User.create({ name: 'Alex Agent', email: 'agent@demo.com', password: 'password123', role: 'agent' });
  const agent2 = await User.create({ name: 'Bianca Agent', email: 'agent2@demo.com', password: 'password123', role: 'agent' });
  const requester = await User.create({ name: 'Rita Requester', email: 'requester@demo.com', password: 'password123', role: 'requester' });

  console.log('Creating categories...');
  const catNetwork = await Category.create({ name: 'Network', description: 'Connectivity and network issues' });
  const catSoftware = await Category.create({ name: 'Software', description: 'Application bugs and installs' });
  await Category.create({ name: 'Hardware', description: 'Physical equipment issues' });

  console.log('Creating sample tickets...');
  const ticket1 = await Ticket.create({
    ticketNo: 'TKT-1001',
    title: 'Cannot connect to office WiFi',
    description: 'Laptop fails to join the office WiFi network since this morning.',
    category: catNetwork._id,
    priority: 'High',
    status: 'Assigned',
    requester: requester._id,
    assignedAgent: agent1._id,
  });
  await StatusHistory.create({ ticket: ticket1._id, changedBy: requester._id, fromStatus: null, toStatus: 'Open', note: 'Ticket created' });
  await StatusHistory.create({ ticket: ticket1._id, changedBy: admin._id, fromStatus: 'Open', toStatus: 'Assigned', note: `Assigned to ${agent1.name}` });
  await Comment.create({ ticket: ticket1._id, author: requester._id, message: 'Still happening, tried restarting the router too.' });

  const ticket2 = await Ticket.create({
    ticketNo: 'TKT-1002',
    title: 'App crashes on file upload',
    description: 'The internal CRM crashes whenever I try to upload a PDF over 5MB.',
    category: catSoftware._id,
    priority: 'Medium',
    status: 'Open',
    requester: requester._id,
  });
  await StatusHistory.create({ ticket: ticket2._id, changedBy: requester._id, fromStatus: null, toStatus: 'Open', note: 'Ticket created' });

  console.log('\nSeed complete. Demo accounts:');
  console.log('  Admin:     admin@demo.com / password123');
  console.log('  Agent 1:   agent@demo.com / password123');
  console.log('  Agent 2:   agent2@demo.com / password123');
  console.log('  Requester: requester@demo.com / password123');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
