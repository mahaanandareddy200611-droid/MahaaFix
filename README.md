🔧 MahaaFix

A structured service-management platform for customers and workers

MahaaFix is a full-stack application being developed to make service work more structured, trackable, and reliable.

Instead of treating a service request as a simple call or chat, MahaaFix models it as a structured workflow involving authentication, authorization, job assignment, job progress, work records, reviews, and comments.

«Current focus: building the core service workflow from request → authorization → job processing → work record.»

---

📌 Project Status

Active Development

The repository currently contains:

- Backend API
- Web frontend
- Mobile frontend
- Authentication
- User/profile handling
- Role-based authorization
- Job management
- Worker assignment
- Job lifecycle
- Work records
- Reviews and comments
- File-upload infrastructure
- MongoDB persistence
- Validation and centralized error handling

The system is being developed incrementally, so this README documents the current implementation rather than future features.

---

🧠 Core Idea

A typical service interaction can look like:

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

MahaaFix structures that process:

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
Checking / Job Progress
   │
   ▼
Estimate
   │
   ▼
Customer Approval
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

---

🏗️ System Architecture

┌─────────────────────────┐
│     Web / Mobile App    │
│   Customer / Worker     │
└────────────┬────────────┘
             │
             │ HTTP Request
             ▼
┌─────────────────────────┐
│      Express App        │
│        src/app.js       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│         Router          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│       Middleware        │
│                         │
│ Authentication          │
│ Authorization           │
│ Validation              │
│ Job Access              │
│ Upload Handling         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│       Controller        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Service Layer*          │
│ Business Logic          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│       Mongoose          │
│         Models          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│        MongoDB          │
└─────────────────────────┘

* Modules that currently have a service layer use it for business logic. Some modules, such as the current WorkRecord module, route through the controller directly.

The backend is organized into Auth, User, Job, and WorkRecord modules, with middleware, models, configuration, utilities, and common code separated under "src".

---

🔄 Request / Route Flow

A typical protected request moves through:

HTTP Request
     │
     ▼
Express Application
     │
     ▼
Route
     │
     ▼
Authentication
     │
     ▼
Authorization / Job Access
     │
     ▼
Validation / Request Processing
     │
     ▼
Controller
     │
     ▼
Service (where used)
     │
     ▼
Mongoose Model
     │
     ▼
MongoDB
     │
     ▼
Response
     │
     ▼
Client

The current Express application mounts these main route groups:

/profile
/api/v1/auth
/api/v1/jobs
/api/v1/work

It also has centralized "notFound" and "errorHandler" middleware at the end of the application pipeline.

---

🛣️ API Overview

Module| Base Route| Purpose
Authentication| "/api/v1/auth"| Signup, login, password recovery
User| "/profile"| Authenticated user profile
Jobs| "/api/v1/jobs"| Job creation and lifecycle
Work Records| "/api/v1/work"| Work records, reviews, comments

---

🔐 Authentication

Base Route

/api/v1/auth

Endpoints

Method| Endpoint| Purpose
"POST"| "/signup"| Create a user account
"POST"| "/login"| Authenticate a user
"POST"| "/forget-password"| Start password recovery
"POST"| "/verify-reset-otp"| Verify password-reset OTP
"POST"| "/reset-password"| Reset password

These routes are defined in the current authentication router, with Joi-based validation applied before the controllers.

Login Flow

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
Login Controller
  │
  ▼
Authentication Logic
  │
  ▼
Response

---

👤 User / Profile

Base Route

/profile

Endpoint

Method| Endpoint| Protection| Purpose
"GET"| "/profile"| Authentication| Get authenticated user's profile

The profile route is protected by the authentication middleware.

Flow

Client
  │
  ▼
GET /profile
  │
  ▼
Authentication Middleware
  │
  ▼
User Controller
  │
  ▼
Profile Response

---

🔧 Jobs

Jobs are currently the central workflow of MahaaFix.

Base Route

/api/v1/jobs

Endpoints

Method| Endpoint| Middleware / Protection
"GET"| "/"| Auth
"GET"| "/my-jobs"| Auth
"POST"| "/create"| Auth + Validation
"GET"| "/:id"| Auth + Load Job
"POST"| "/:id/assign"| Auth + Load Job + Admin
"PATCH"| "/:id/accepted"| Auth + Worker + Load Job
"PATCH"| "/:id/status"| Auth + Load Job + Job Access
"PATCH"| "/:id/checking"| Auth + Load Job + Job Access
"PATCH"| "/:id/EstimateSubmitted"| Auth + Load Job + Job Access
"PATCH"| "/:id/Approval"| Auth + Load Job + Job Access
"PATCH"| "/:id/WorkCompleted"| Auth + Load Job + Job Access
"PATCH"| "/:id/verified"| Auth + Load Job + Job Access
"PATCH"| "/:id/ReworkRequired"| Auth + Load Job + Job Access

These routes and their middleware order are defined directly in the current "Job.Router.js".

---

🔁 Job Lifecycle

The current job workflow is state-driven:

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
Work Completed
   │
   ▼
Verification
   │
   ├──────────────► Verified
   │
   └──────────────► Rework Required

The corresponding route operations are:

POST  /create
        ↓
POST  /:id/assign
        ↓
PATCH /:id/accepted
        ↓
PATCH /:id/checking
        ↓
PATCH /:id/EstimateSubmitted
        ↓
PATCH /:id/Approval
        ↓
PATCH /:id/WorkCompleted
        ↓
PATCH /:id/verified
        │
        └────── or ──────► PATCH /:id/ReworkRequired

---

🔐 Job Authorization Flow

Authentication alone is not enough to perform every job operation.

The current backend checks different conditions depending on the operation:

Request
   │
   ▼
Authentication
   │
   ▼
Load Job
   │
   ▼
Role / Job Access Check
   │
   ├── Admin
   ├── Worker
   ├── Assigned Worker
   └── Job Participant
   │
   ▼
Controller

Current job-related middleware includes:

Auth
isAdmin
isWorker
isAssignedWorker
inJobWorkers
loadJob

---

📋 Work Records

Base Route

/api/v1/work

Work records preserve information about service work and provide the basis for reviews and comments.

Endpoints

Method| Endpoint| Protection
"GET"| "/allWorkRecords"| Public
"POST"| "/WorkRecord"| Auth + Worker + Validation
"GET"| "/work-records"| Auth
"GET"| "/work-records/:id"| Auth
"PATCH"| "/work-records/:id"| Auth + Worker
"DELETE"| "/work-records/:id"| Auth + Worker
"POST"| "/work-records/:id/review"| Auth
"PATCH"| "/work-records/:id/review/update"| Auth
"POST"| "/work-records/:id/comment"| Auth

These routes are defined in the current "WorkRecord.Router.js".

---

⭐ Reviews & Comments

Work records support user interaction through reviews and comments.

Work Record
     │
     ├── Review
     │     ├── Create
     │     └── Update
     │
     └── Comment
           └── Add

---

🧩 Backend Structure

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

The repository follows a modular backend structure separating routes, controllers, services where used, validators, middleware, and models.

---

🗂️ Data Models

The backend currently contains models for:

User
Job
WorkRecord
Review
Comment
OutBox

These models are stored under:

backend/src/models/

---

🖥️ Web Frontend

The web application lives in:

frontend/

Its source is organized into:

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

The current web stack is React, Vite, Axios, and React Router.

---

📱 Mobile Frontend

The mobile application lives in:

mobilefrontend/

It is built using React Native and Expo, with React Navigation and Axios.

---

🧰 Technology Stack

Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Joi
- Multer
- Cloudinary
- Nodemailer
- OpenAI
- CORS
- dotenv

These dependencies are present in the current backend project configuration.

Web

- React
- Vite
- React Router
- Axios

Mobile

- React Native
- Expo
- React Navigation
- Axios
- AsyncStorage
- Expo Secure Store

---

🛡️ Error Handling

The backend includes centralized handling for missing routes and application errors:

Request
   │
   ▼
Route Not Found
   │
   ▼
notFound Middleware
   │
   ▼
errorHandler
   │
   ▼
HTTP Response

The "notFound" and "errorHandler" middleware are registered after the application routes.

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

Then start the server:

node server.js

For development with Nodemon:

npx nodemon server.js

The current backend also exposes:

GET /

which responds with:

MahaaFix Backend Running 🚀

The backend currently does not define an "npm run dev" script in "package.json", so the commands above reflect the repository as it exists today.

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

The web and mobile package files define the corresponding development commands.

---

🔒 Environment Variables

Do not commit real credentials to GitHub.

The backend uses environment variables for configuration such as:

MongoDB connection
JWT secret
Frontend origin
Cloudinary credentials

Keep secrets inside:

.env

---

🎯 Current Development Scope

The current MahaaFix implementation is focused on:

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

The goal at this stage is to make the existing workflow work correctly and consistently from the client request through backend authorization, business logic, persistence, and response.

---

🚧 Development Status

MahaaFix is an active work in progress.

The architecture and application will continue to evolve as new functionality is implemented.

This README will be updated alongside the codebase so that it reflects the actual state of the project.

---

👨‍💻 MahaaFix

MahaaFix
A full-stack service-management platform currently being developed with a backend-first approach.

Repository:
https://github.com/mahaanandareddy200611-droid/MahaaFix
