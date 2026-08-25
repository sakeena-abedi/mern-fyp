# HelpDesk Pro — Support Ticket Management System

A full-stack MERN application (MongoDB, Express, React, Node.js) for the
"Helpdesk & Support Ticket Management System" project brief. Three roles —
**Requester**, **Agent**, and **Admin** — each get a scoped view of tickets,
with JWT authentication, role-based authorization, ownership checks, a
status workflow with history, and internal/external comments.

## Features implemented

- **Auth**: JWT-based register/login, bcrypt password hashing, protected routes
- **Roles**: requester / agent / admin, enforced server-side on every route
- **Tickets**: create, view (scoped by role), edit while Open, search, filter
  (status/priority/category/date), pagination
- **Assignment**: admin assigns tickets to agents
- **Status workflow**: `Open → Assigned → In Progress → Resolved → Closed`,
  with a fixed set of valid transitions enforced on the backend (no illegal
  jumps), a required resolution note before marking Resolved, and requester-
  initiated reopening from Resolved
- **Status history**: every transition logged with who/when/note
- **Comments**: threaded per ticket; agents/admins can mark a comment
  "internal" (hidden from the requester)
- **Categories**: admin CRUD, with soft deactivation
- **Users**: admin can view all users, change roles, activate/deactivate
  accounts
- **Dashboard**: role-scoped stats (total/open/resolved/overdue), breakdown
  by status and priority, recent activity feed

## Tech stack

- **Backend**: Node.js, Express, MongoDB + Mongoose, JWT, bcryptjs
- **Frontend**: React 19 (Vite), React Router, Axios, plain CSS (no UI framework)

## Project structure

```
helpdesk-system/
├── server/                 # Express API
│   ├── config/db.js
│   ├── models/              # User, Category, Ticket, Comment, StatusHistory
│   ├── controllers/
│   ├── routes/
│   ├── middleware/          # auth (JWT + role guard), error handler
│   ├── utils/                # token + ticket-number generators
│   ├── seed.js               # demo data
│   └── server.js
└── client/                  # React app
    └── src/
        ├── api/axios.js      # axios instance with auth interceptor
        ├── context/AuthContext.jsx
        ├── components/       # Navbar, ProtectedRoute, Badges
        └── pages/            # Login, Register, Dashboard, Tickets,
                               # CreateTicket, TicketDetails, Categories, Users
```

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB instance — either local (`mongod`) or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Backend setup

```bash
cd server
cp .env.example .env
# edit .env and set MONGO_URI (and a real JWT_SECRET)
npm install
npm run seed     # creates demo users, categories, and sample tickets
npm run dev       # starts the API on http://localhost:5000
```

Demo accounts created by the seed script (all use password `password123`):

| Role      | Email               |
|-----------|---------------------|
| Admin     | admin@demo.com      |
| Agent     | agent@demo.com      |
| Agent     | agent2@demo.com     |
| Requester | requester@demo.com  |

### 2. Frontend setup

In a second terminal:

```bash
cd client
cp .env.example .env   # defaults to http://localhost:5000/api, adjust if needed
npm install
npm run dev             # starts on http://localhost:5173
```

Open http://localhost:5173, log in with any demo account above, and explore.
Register a new account to try the requester/agent signup flow (admins can
only be created via the seed script or by promoting a user from the Users
page as an existing admin).

## API overview

| Method | Route                          | Access                  |
|--------|---------------------------------|--------------------------|
| POST   | `/api/auth/register`            | Public                  |
| POST   | `/api/auth/login`               | Public                  |
| GET    | `/api/auth/me`                  | Authenticated            |
| GET    | `/api/tickets`                  | Authenticated (scoped)   |
| POST   | `/api/tickets`                  | Authenticated             |
| GET    | `/api/tickets/:id`               | Owner / assigned agent / admin |
| PATCH  | `/api/tickets/:id`                | Owner (while Open) / admin |
| PATCH  | `/api/tickets/:id/assign`         | Admin                     |
| PATCH  | `/api/tickets/:id/status`          | Assigned agent / admin / owner (reopen only) |
| GET    | `/api/tickets/:id/history`         | Same as ticket access     |
| GET/POST | `/api/tickets/:id/comments`      | Same as ticket access     |
| GET/POST | `/api/categories`                 | Authenticated / Admin (write) |
| PATCH  | `/api/categories/:id`             | Admin                      |
| GET    | `/api/users`                       | Admin                      |
| PATCH  | `/api/users/:id`                   | Admin                      |
| GET    | `/api/dashboard`                   | Authenticated (scoped)     |

## Notes on business logic

- **Status transitions are whitelisted server-side** (`VALID_TRANSITIONS` in
  `ticketController.js`) — the API rejects any illegal jump (e.g. Open → Closed).
- **Ownership is enforced on every read/write** — a requester can never fetch,
  comment on, or edit another user's ticket by guessing an ID; an agent can
  only act on tickets assigned to them.
- **Resolving a ticket requires a resolution note.**
- **Requesters can only edit their own ticket while it's still Open**; once
  it moves into the workflow, only the assigned agent/admin can change it
  (except for reopening a Resolved ticket).

## Suggested next steps (not implemented, good extensions)

- Automated tests (Jest/Supertest for the API, React Testing Library for the UI)
- Rate limiting and input sanitization middleware (helmet, express-rate-limit)
- File upload for screenshots (currently a URL field only) via Cloudinary/S3
- Email notifications on status change
- Average resolution time metric on the dashboard
