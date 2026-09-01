🔧 MahaaFix

A structured service-management platform for customers and workers

MahaaFix is a full-stack application being built to make service work more structured, trackable, and reliable.

Instead of handling a service request only through calls or messages, MahaaFix models the interaction as a structured job lifecycle involving customers, workers, authentication, authorization, job assignment, work progress, work records, reviews, comments, and proof.

The project is currently under active development, with the backend serving as the core of the system.

---

📌 Current Status

Status: Active Development

The current repository contains:

- Backend API
- Web frontend
- Mobile frontend
- Authentication
- User/profile handling
- Role-based authorization
- Job management
- Worker assignment
- Job lifecycle management
- Work records
- Reviews and comments
- File-upload infrastructure
- MongoDB persistence
- Error handling and validation

The repository is intentionally evolving feature by feature.

---

🧠 Core Idea

A normal service interaction can look like:

Customer
   │
   ▼
Call / Message
   │
   ▼
Worker
   │
   ▼
Work
   │
   ▼
Done

MahaaFix turns that into a structured system:

Customer
    │
    ▼
Create Job
    │
    ▼
Assign Worker
    │
    ▼
Worker Accepts
    │
    ▼
Job Progress
    │
    ▼
Estimate / Approval
    │
    ▼
Work Completed
    │
    ▼
Verification
    │
    ▼
Work Record
    │
    ▼
Review / Comment

This structured workflow is the current foundation of MahaaFix.

---

🏗️ System Architecture

At a high level, the current system is organized as:

┌──────────────────────┐
│       Customer       │
│       / Worker       │
└──────────┬───────────┘
           │
           │ HTTP Request
           ▼
┌──────────────────────┐
│   Web / Mobile App   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    Express Server    │
│       src/app.js     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       Router         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      Middleware      │
│                      │
│ Authentication       │
│ Authorization        │
│ Validation           │
│ Job Access           │
│ Upload Handling      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      Controller      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       Service        │
│    Business Logic    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       Mongoose       │
│        Models        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       MongoDB        │
└──────────────────────┘

The backend currently separates modules into Auth, User, Job, and WorkRecord, while common middleware, models, configuration, utilities, and mail functionality live separately under "src".

---

🔄 Request / Route Flow

This is one of the most important parts of the current backend.

A request generally moves through:

HTTP Request
     │
     ▼
Express Application
     │
     ▼
Route
     │
     ▼
Authentication / Authorization
     │
     ▼
Validation / Job Loading
     │
     ▼
Controller
     │
     ▼
Service
     │
     ▼
Model
     │
     ▼
MongoDB
     │
     ▼
Controller Response
     │
     ▼
Client

The application registers the current route groups in "src/app.js": "/profile", "/api/v1/auth", "/api/v1/jobs", and "/api/v1/work".

---

🛣️ API Routes

Authentication

Base route:

/api/v1/auth

Current endpoints:

Method| Endpoint| Purpose
POST| "/signup"| Create an account
POST| "/login"| Authenticate a user
POST| "/forget-password"| Start password recovery
POST| "/verify-reset-otp"| Verify reset OTP
POST| "/reset-password"| Reset password

The authentication router applies request validation before passing requests to the corresponding controller.

Authentication flow

Client
  │
  ▼
POST /api/v1/auth/login
  │
  ▼
Auth Router
  │
  ▼
Validation
  │
  ▼
Auth Controller
  │
  ▼
Authentication Logic
  │
  ▼
Response

---

👤 User / Profile

Base route:

/profile

Current endpoint:

Method| Endpoint| Middleware| Purpose
GET| "/profile"| Auth| Get authenticated user's profile

The profile route is protected by the authentication middleware.

Flow:

Client
  │
  ▼
GET /profile
  │
  ▼
Auth Middleware
  │
  ▼
User Controller
  │
  ▼
Profile
  │
  ▼
Response

---

🔧 Jobs

Base route:

/api/v1/jobs

Jobs are currently the central workflow of MahaaFix.

Current endpoints

Method| Endpoint| Main protection
GET| "/"| Auth
GET| "/my-jobs"| Auth
POST| "/create"| Auth + Validation
GET| "/:id"| Auth + Job Loading
POST| "/:id/assign"| Auth + Job Loading + Admin
PATCH| "/:id/accepted"| Auth + Worker
PATCH| "/:id/status"| Auth + Job Access
PATCH| "/:id/checking"| Auth + Job Access
PATCH| "/:id/EstimateSubmitted"| Auth + Job Access
PATCH| "/:id/Approval"| Auth + Job Access
PATCH| "/:id/WorkCompleted"| Auth + Job Access
PATCH| "/:id/verified"| Auth + Job Access
PATCH| "/:id/ReworkRequired"| Auth + Job Access

These routes and their middleware chains are defined directly in the current "Job.Router.js".

---

🔁 Job Lifecycle

The current job router models a state-driven workflow:

Created
   │
   ▼
Assigned
   │
   ▼
Accepted
   │
   ▼
Checking
   │
   ▼
Estimate Submitted
   │
   ▼
Approval
   │
   ▼
Work In Progress
   │
   ▼
Work Completed
   │
   ▼
Verification
   │
   ├──────────────► Verified
   │
   └──────────────► Rework Required

The corresponding operations are represented by the current job endpoints:

/create
   ↓
/:id/assign
   ↓
/:id/accepted
   ↓
/:id/checking
   ↓
/:id/EstimateSubmitted
   ↓
/:id/Approval
   ↓
/:id/WorkCompleted
   ↓
/:id/verified
       or
/:id/ReworkRequired

This is one of the main pieces of business logic currently being developed in MahaaFix.

---

🔐 Job Authorization Flow

MahaaFix does not treat every authenticated user as having unlimited access to every job operation.

Different routes use different middleware.

For example:

Request
   │
   ▼
Auth
   │
   ▼
Load Job
   │
   ├── Admin?
   │
   ├── Worker?
   │
   ├── Assigned Worker?
   │
   └── Member of Job?
   │
   ▼
Controller

The backend currently contains middleware for:

Auth
isAdmin
isWorker
isAssignedWorker
inJobWorkers
loadJob

along with error handling, async handling, upload handling, and not-found handling.

---

📋 Work Records

Base route:

/api/v1/work

Work records preserve information about completed service work.

Current endpoints

Method| Endpoint| Protection
GET| "/allWorkRecords"| Public
POST| "/WorkRecord"| Auth + Worker + Validation
GET| "/work-records"| Auth
GET| "/work-records/:id"| Auth
PATCH| "/work-records/:id"| Auth + Worker
DELETE| "/work-records/:id"| Auth + Worker
POST| "/work-records/:id/review"| Auth
PATCH| "/work-records/:id/review/update"| Auth
POST| "/work-records/:id/comment"| Auth

These are the routes currently implemented in "WorkRecord.Router.js".

---

⭐ Reviews & Comments

Work records can have user interaction attached to them.

Current operations include:

Work Record
     │
     ├── Review
     │     ├── Create
     │     └── Update
     │
     └── Comment
           └── Add

The repository also contains dedicated MongoDB models for:

Review
Comment
WorkRecord

alongside "User", "job", and "OutBox" models.

---

📦 Backend Architecture

The backend follows a modular organization:

backend/
└── src/
    │
    ├── Modules/
    │   ├── Auth/
    │   │   ├── Auth.Router.js
    │   │   ├── Auth.Contoller.js
    │   │   ├── Auth.Service.js
    │   │   └── Auth.Validator.js
    │   │
    │   ├── User/
    │   │   ├── User.Router.js
    │   │   ├── User.Controller.js
    │   │   └── User.Service.js
    │   │
    │   ├── Job/
    │   │   ├── Job.Router.js
    │   │   ├── Job.Controller.js
    │   │   ├── Job.Services.js
    │   │   └── Job.Validator.js
    │   │
    │   └── WorkRecord/
    │       ├── WorkRecord.Router.js
    │       ├── WorkRecord.Controller.js
    │       └── WorkRecord.Validator.js
    │
    ├── middleware/
    ├── models/
    ├── config/
    ├── utils/
    ├── common/
    └── app.js

The module structure and individual router/controller/service/validator files are present in the current repository.

---

🗂️ Data Models

The current backend contains these main models:

User
Job
WorkRecord
Review
Comment
OutBox

These models are currently stored under:

backend/src/models/

---

🖥️ Frontend

The web application is located in:

frontend/

The current frontend source is organized into:

frontend/src/
├── api/
├── css/
├── pages/
├── routes/
├── services/
├── App.jsx
├── App.css
├── index.css
└── main.jsx

The frontend already has separate API, routing, page, and service areas rather than putting everything into a single component.

---

📱 Mobile Frontend

The repository also contains:

mobilefrontend/

This is the mobile application side of MahaaFix and is being developed separately from the web frontend.

---

🧰 Technology Stack

Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt / bcryptjs
- Joi
- Multer
- Cloudinary
- Nodemailer
- OpenAI
- CORS
- dotenv

These dependencies are present in the current backend package configuration.

Web Frontend

- React
- Vite
- React Router
- Axios

Mobile

- React Native
- Expo

---

🧩 Backend Design

The current backend is organized around separation of responsibilities:

Router
  │
  ▼
Middleware
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
Model
  │
  ▼
Database

For example:

Job Request
     │
     ▼
Job.Router.js
     │
     ▼
Auth / Role / Job Middleware
     │
     ▼
Job.Controller.js
     │
     ▼
Job.Services.js
     │
     ▼
job.js
     │
     ▼
MongoDB

This structure allows the application to keep routing, authorization, business logic, and persistence separated.

---

🛡️ Error Handling

The backend has centralized middleware for:

404 / Not Found
        │
        ▼
Error Handler
        │
        ▼
HTTP Response

"notFound" and "errorHandler" are registered after the application routes in "app.js", with the error handler intentionally placed at the end of the middleware chain.

---

📁 Repository Structure

MahaaFix/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── Modules/
│       │   ├── Auth/
│       │   ├── User/
│       │   ├── Job/
│       │   └── WorkRecord/
│       │
│       ├── middleware/
│       ├── models/
│       ├── config/
│       ├── utils/
│       ├── common/
│       └── app.js
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── css/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
│
└── mobilefrontend/
    └── ...

---

▶️ Running the Project

Backend

cd backend
npm install

Create a ".env" file with the required environment variables.

Then start the backend:

node server.js

For development:

npx nodemon server.js

The backend currently exposes:

GET /

which returns:

MahaaFix Backend Running 🚀

---

Web Frontend

cd frontend
npm install
npm run dev

---

Mobile Frontend

cd mobilefrontend
npm install
npm start

---

🔒 Environment Variables

Do not commit real credentials to GitHub.

The backend uses environment configuration for values such as:

MongoDB connection
JWT secret
Frontend origin
Cloudinary credentials

Keep secrets inside ".env".

---

📍 Current Development Scope

The current repository is focused on getting the fundamental MahaaFix workflow working end-to-end:

Authentication
      ↓
Users
      ↓
Jobs
      ↓
Worker Assignment
      ↓
Job Lifecycle
      ↓
Work Records
      ↓
Reviews / Comments

The project is being developed incrementally, so this README documents the current implementation rather than presenting future ideas as completed features.

---

🚧 Development Status

MahaaFix is an active work in progress.

The architecture and product will continue to evolve as additional functionality is implemented.

For now, the primary focus is:

«Build the core service workflow correctly from request → authorization → job processing → work record.»

---

👨‍💻 Project

MahaaFix

A full-stack service-management system currently being developed with a backend-first approach.

Repository:
https://github.com/mahaanandareddy200611-droid/MahaaFix
