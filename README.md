# 🔧 MahaaFix

> **A service-management platform connecting customers and workers through a structured job workflow.**

MahaaFix is a full-stack application currently under development.

The project focuses on building a structured system for **customers, workers, jobs, work records, authentication, and role-based access** rather than relying only on informal communication.

---

## 🚀 What MahaaFix Does

MahaaFix is designed around the lifecycle of a service job.

Instead of:

```text
Customer → Worker → WhatsApp/Call → Work → Done
```

MahaaFix structures the process:

```text
Customer
   │
   ▼
Create Job
   │
   ▼
Worker Assignment
   │
   ▼
Worker Accepts
   │
   ▼
Work Process
   │
   ▼
Work Completed
   │
   ▼
Verification
   │
   ▼
Work Record
```

The current implementation is focused on building this foundation correctly.

---

# 🏗️ Current Architecture

The repository is divided into three main applications:

```text
MahaaFix/
│
├── backend/
│   └── Node.js + Express + MongoDB
│
├── frontend/
│   └── React + Vite
│
└── mobilefrontend/
    └── React Native + Expo
```

### Backend

The backend is the main part of the current development and contains modules for:

```text
Auth
User
Job
WorkRecord
```

It also contains middleware and configuration for authentication, authorization, uploads, database connectivity, and error handling.

---

# ⚙️ Technology Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcrypt
* Joi
* Cloudinary
* Nodemailer
* OpenAI

### Web

* React
* Vite
* Axios
* React Router

### Mobile

* React Native
* Expo
* React Navigation
* Axios
* AsyncStorage
* Expo Secure Store

---

# 🔐 Authentication

MahaaFix currently has a dedicated authentication system.

Authentication includes:

```text
Signup
   ↓
Login
   ↓
JWT Authentication
   ↓
Protected Routes
```

Passwords are hashed before being stored, and protected endpoints use authentication middleware.

---

# 👥 Roles

MahaaFix uses role-based access control.

The current system is designed around different users having different permissions.

```text
Customer
Worker
Admin
Operator
```

Authorization middleware is used to restrict operations according to the user's role and relationship to a job.

---

# 📋 Job Management

Jobs are one of the central entities in MahaaFix.

A job represents a service request and moves through a defined lifecycle instead of being treated as a single database record with no state.

Current workflow:

```text
Created
   ↓
Assigned
   ↓
Worker Accepted
   ↓
Checking
   ↓
Estimate Submitted
   ↓
Waiting Customer Approval
   ↓
Temporary Fix Approved
   ↓
In Progress
   ↓
Work Completed
   ↓
Verification Pending
   ↓
Verified
```

Other possible outcomes include:

```text
Rework Required
Rejected
```

This state-based design makes the workflow explicit and provides the foundation for enforcing which actions are allowed at each stage.

---

# 🧰 Work Records

MahaaFix also contains a **WorkRecord** module.

The purpose of the work record is to preserve information about completed service work instead of allowing the information to disappear when a job is finished.

This forms the foundation for maintaining a history of work performed by workers.

---

# 📸 File Uploads

The backend contains upload support and Cloudinary configuration for handling uploaded media.

This allows MahaaFix to work with job-related images and other proof/evidence.

The upload flow is part of the current backend architecture.

---

# 📁 Project Structure

```text
MahaaFix/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── app.js
│       │
│       ├── Modules/
│       │   ├── Auth/
│       │   ├── User/
│       │   ├── Job/
│       │   └── WorkRecord/
│       │
│       ├── config/
│       ├── middleware/
│       ├── models/
│       ├── utils/
│       └── common/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── mobilefrontend/
    ├── src/
    ├── assets/
    └── package.json
```

---

# ▶️ Running the Backend

```bash
cd backend
npm install
```

Create a `.env` file containing the required configuration.

Example:

```env
PORT=5000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

Then start the server:

```bash
node server.js
```

For development:

```bash
npx nodemon server.js
```

---

# ▶️ Running the Web Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 📱 Running the Mobile App

```bash
cd mobilefrontend
npm install
npm start
```

The mobile application uses Expo.

---

# 🔄 How the Current System Fits Together

At a high level:

```text
                    ┌───────────────┐
                    │   Customer    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Frontend   │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Express API  │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
           Auth           Jobs       WorkRecords
              │             │             │
              └─────────────┼─────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    MongoDB    │
                    └───────────────┘
```

---

# 🚧 Current Status

**MahaaFix is actively under development.**

The current repository represents the foundation of the application:

* Authentication
* User management
* Role-based authorization
* Job management
* Worker assignment
* Job lifecycle
* Work records
* Upload infrastructure
* Web frontend
* Mobile frontend

More functionality will be added incrementally as the system develops.

---

# 🎯 Development Direction

The immediate goal is to make the existing MahaaFix workflow **complete, reliable, and usable end-to-end**.

Future architectural improvements will be documented here only after they are actually implemented.

---

## 👨‍💻 Project

**MahaaFix**

GitHub:
https://github.com/mahaanandareddy200611-droid/MahaaFix
